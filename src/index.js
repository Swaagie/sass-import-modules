'use strict';

import Dependencies from './dependencies';
import diagnostics from 'diagnostics';
import resolve from 'resolve';
import path from 'path';
import fs from 'fs';

const mock = path.join(__dirname, '..', 'circular.scss');
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
 * Check if the file exists.
 *
 * @param {String} file
 * @param {Function} done Completion callback
 * @returns {void}
 * @api private
 */
function exists(file, done) {
  return void fs.stat(file, (error, stat) => {
    done(!error && !!stat);
  });
}

/**
 * Resolve the file in node_modules.
 *
 * @param {String} base Current directory.
 * @param {String} file File path.
 * @param {String} ext File extension.
 * @param {Function} next Completion callback.
 * @returns {void}
 * @api private
 */
function node(base, file, ext, next)  {
  debug('Resolving file from node_modules: %s', file);

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
function local(base, file, ext, next) {
  debug('Resolving file locally: %s', file);
  file = extension(path.join(base, file), ext);

  return void exists(file, exist => {
    next(null, exist ? file : null);
  });
}

/**
 * Resolve the file as partial by prepending an underscore.
 *
 * @param {String} file File path.
 * @param {String} base Current directory.
 * @param {String} ext File extension.
 * @param {Function} next Completion callback.
 * @returns {void}
 * @api private
 */
function partial(base, file, ext, next) {
  debug('Resolving file as partial with prepended underscore: %s', file);
  file = path.join(path.dirname(file), '_' + path.basename(file));

  return void local(base, file, ext, next);
}

/**
 * Generate a set of resolvers for each include path. Depending on the order
 * and provided resolvers, resolvers will resolve the file:
 *
 *  - relative to the previous file.
 *  - from a module in node_modules.
 *  - as partial with prepended underscore relative to the previous file.
 *
 * @param {Array} String references to resolvers.
 * @returns {Array} Resolve methods.
 * @api private
 */
function getResolvers(resolvers) {
  const resolverSet = { local, node, partial };

  return resolvers.map(name => {
    return {
      name: name,
      fn: resolverSet[name]
    }
  }).filter(resolver => resolver.fn);
}

/**
 * Setup an importer for node-sass.
 *
 * @param {Object} options Optional configuration.
 * @returns {Function} Importer.
 * @api public
 */
export function importer({ paths = process.cwd(), ext = '.scss', resolvers = ['local', 'node']} = {}) {
  const dependencies = new Dependencies();
  resolvers = getResolvers(resolvers);

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
    const { includePaths } = this.options || {};
    const dirnamePrev = path.dirname(prev);
    const includes = [].concat(includePaths || [], dirnamePrev, paths);
    const fns = resolvers.reduce((arr, resolver) => arr.concat(
      includes.map(base => Object.assign({ base }, resolver))
    ), []);

    debug('Resolving: %s', url);
    (function run(stack, error) {
      const resolver = stack.shift();

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
        // Mock with empty file if a circular dependency is detected.
        //
        if (dependencies.circular(prev, file)) {
          debug('Found circular dependency, mocking empty file');
          return void provide(mock, done);
        }

        //
        // Resolved to a file on disk, return the file early.
        //
        if (file) {
          dependencies.add(prev, file);
          return void provide(file, done);
        }

        //
        // All resolvers ran, no results found, return error if any.
        //
        if (!stack.length) {
          if (error) throw new Error(`Could not find file: ${url} from parent ${prev}`);
          return void done();
        }

        //
        // Iterate over the stack.
        //
        debug('Stack step complete, iterating over remaining %d', stack.length);
        return void run(stack, err, next);
      }

      debug('Lookup %s [%s,  %s]', url, resolver.name, resolver.base);
      resolver.fn(resolver.base, url, ext, next);
    })(fns);
  }
};
