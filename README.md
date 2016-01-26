## SASS import modules

[![Version npm][version]](http://browsenpm.org/package/sass-import-modules)[![Build Status][build]](https://travis-ci.org/Swaagie/sass-import-modules)[![Dependencies][david]](https://david-dm.org/Swaagie/sass-import-modules)[![Coverage Status][cover]](https://coveralls.io/r/Swaagie/sass-import-modules?branch=master)

[version]: http://img.shields.io/npm/v/sass-import-modules.svg?style=flat-square
[build]: http://img.shields.io/travis/Swaagie/sass-import-modules/master.svg?style=flat-square
[david]: https://img.shields.io/david/Swaagie/sass-import-modules.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/Swaagie/sass-import-modules/master.svg?style=flat-square

SASS/SCSS helper function to import modules or files from node_modules without the need to specify full paths. For example, `@import "node_modules/test/file.scss";` will become `@import "test/file";`. The order of resolvers is configurable, e.g. partials can be given priority over `node_modules`.

### Install

```bash
npm install --save sass-import-modules
```

### Usage

##### node-sass

If your using node-sass programmatically, add the importer to options.

```js
import importer from 'sass-import-modules';

sass.render({
  importer: importer(/* { options } */)
}, (error, result) => {
  // node-sass output
})
```

##### WebPack

Add the importer to the `sassLoader` options.

```js
import importer from 'sass-import-modules';

module.exports = {
  sassLoader: {
    importer: importer(/* { options } */)
  }
}
```

### Options

The following options are supported, provide them as object to the importer:

```js
  import importer from 'sass-import-modules';

  importer(/* { options } */);
```

- **ext** file extension, i.e `.scss`, `.sass`, `scss` or `sass` (default: `.scss`).
- **resolvers** order of and set of resolvers to use, i.e. `local`, `node`, `partial` (default: `['local', 'node']`).
- **paths** additional lookup paths, should be absolute.

### License

MIT