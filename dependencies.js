'use strict';

/**
 * Memoize dependency tree.
 * TODO: create class that is extended with Map. Not supported in V8 yet.
 *
 * @constructor
 * @param {Map} options.cache Memoizer.
 * @api public
 */
function Dependencies({ cache = new Map } = {}) {
  this.cache = cache;
}

/**
 * Add the dependency to the list.
 *
 * @param {String} parent Filepath of file referencing the dependency.
 * @param {String} dependency Filepath of the dependency.
 * @returns {Boolean} Circular or not?
 * @api public
 */
Dependencies.prototype.add = function add(parent, dependency) {
  if (!this.cache.has(parent)) {
    this.cache.set(parent, []);
  }

  this.cache.get(parent).push(dependency);
}

/**
 * Check circular references by inspecting dependencies of the dependant.
 *
 * @param {String} parent Filepath of file referencing the dependency.
 * @param {String} dependency Filepath of the dependency.
 * @returns {Boolean} Circular or not?
 * @api public
 */
Dependencies.prototype.circular = function circular(parent, dependency) {
  if (!this.cache.has(dependency)) {
    return false;
  }

  return ~this.cache.get(dependency).indexOf(parent);
}

export default Dependencies;