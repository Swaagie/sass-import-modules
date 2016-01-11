'use strict';

import diagnostics from 'diagnostics';
import resolve from 'resolve';
import path from 'path';
import fs from 'fs';

const debug = diagnostics('sass-import-modules');

/**
 * Append extension to file if required.
 *
 * @param {String} file File path.
 * @param {String} ext File extension.
 * @returns {String} file.
 * @api private
 */
function extension(file, ext) {
  if (!~file.indexOf(ext)) {
    file += ext;
  }

  return file;
}

/**
 * Resolve the file in node_modules.
 *
 * @param {String} file File path.
 * @param {String} base Current directory.
 * @param {String} ext File extension.
 * @param {Function} next Completion callback.
 * @returns {void}
 * @api private
 */
function node(file, base, ext, next)  {
  debug('Resolving file from node_modules: %s', file);
  base = path.dirname(base);

  return void resolve(extension(file, ext), { basedir: base }, (error, result) => {
    if (result) {
      return next(null, result);
    }

    resolve(file, { basedir: base }, next);
  });
}

/**
 * Resolve the file locally.
 *
 * @param {String} file File path.
 * @param {String} base Current directory.
 * @param {String} ext File extension.
 * @param {Function} next Completion callback.
 * @returns {void}
 * @api private
 */
function local(file, base, ext, next) {
  debug('Resolving file locally: %s', file);
  file = extension(path.join(path.dirname(base), file), ext);

  return void fs.stat(file, function exists(error, stat) {
    if (error || !stat) {
      return next(error);
    }

    next(null, file);
  });
}

/**
 * Return the file path to node-sass.
 *
 * @param {String} file Absolute path to file.
 * @param {Function} done Completion callback.
 * @returns {void}
 * @api private
 */
function provide(file, done) {
  return void done({ file });
}

/**
 * Setup an importer for node-sass.
 *
 * @param {Object} options Optional configuration.
 * @returns {Function} Importer.
 * @api public
 */
export function importer({ ext = '.scss' } = {}) {
  const cache = new Map();

  if (ext.charAt(0) !== '.') {
    ext = '.' + ext;
  }

  /**
   * Importer for SASS.
   *
   * @param {String} url File to resolve.
   * @param {String} prev Last resolved file.
   * @param {Function} done Completion callback.
   * @returns {void} Return early.
   * @api private
   */
  return function resolve(url, prev, done) {
    if (cache.has(url)) {
      debug('Resolving from cache: %s', url);
      return void provide(cache.get(url), done);
    }

    //
    // 1. Find the file relative to the previous discovered file.
    // 2. Find the file or module in node_modules.
    //
    debug('Resolving: %s', url);
    (function run(stack, error) {
      /**
       * Completion callback.
       *
       * @param {Error} err Error returned from resolver.
       * @param {String} file Full path to file.
       * @returns {Void} return early.
       * @api private
       */
      function next(err, file) {
        error = error || err;

        //
        // Resolved to a file on disk, return the file early.
        //
        if (file) {
          cache.set(url, file);
          return void provide(file, done);
        }

        //
        // All resolvers ran, no results found, return error.
        //
        if (error && !stack.length) {
          throw new Error(`Could not find file: ${url} from parent ${prev}`);
        }

        //
        // Iterate over the stack.
        //
        return void run(stack, err, next);
      }

      stack.shift()(url, prev, ext, next);
    })([local, node]);
  }
};