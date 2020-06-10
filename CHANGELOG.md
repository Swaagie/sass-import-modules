# CHANGELOG

### 5.0.0

- Remove ESM and expose CJS
- Remove babel dependencies and build step/requirement
- Expose default importer for CLI usage of `node-sass`
- Add `partial` to default available resolvers

### 4.0.1

- Use the `extensions` option of the `node` resolve algorithm to ensure that
  we do not accidentally default to an `.js` file. 

### 4.0.0

- Use latest dependencies, e.g. @babel instead of old babel.
- No longer preserveSymlinks when resolving.
