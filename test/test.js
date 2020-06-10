'use strict';

const sassImporter = require('../src');
const sass = require('node-sass');
const assume = require('assume');
const path = require('path');

const { importer } = sassImporter;
const fixtures = path.join(__dirname, 'fixtures', 'index.scss');

describe('SASS import modules', function () {
  let imports;

  beforeEach(function () {
    imports = importer().bind({});
  });

  it('exposes a default importer for CLI usage', function () {
    assume(importer().name).to.deep.equal(sassImporter.name);
    assume(sassImporter).to.be.a('function');
  });

  it('returns an importer function', function () {
    assume(imports).to.be.a('function');
    assume(imports).to.have.length(3);
  });

  it('has configurable extensions', function (done) {
    imports = importer({ ext: 'sass' }).bind({});

    imports('ext', fixtures, function ({ file } = {}) {
      assume(file).to.be.a('string');
      assume(file).to.include('test/fixtures/ext.sass');
      done();
    });
  });

  it('imports relatives files', function (done) {
    imports('second', fixtures, function ({ file } = {}) {
      assume(file).to.be.a('string');
      assume(file).to.include('test/fixtures/second.scss');
      done();
    });
  });

  it('can resolve symlinked modules', function (done) {
    imports('symlinked-test/file', fixtures, function ({ file } = {}) {
      assume(file).to.be.a('string');
      assume(file).to.include('test/fixtures/node_modules/test/file.scss');
      done();
    });
  });

  it('imports main from node_module', function (done) {
    imports('test', fixtures, function ({ file } = {}) {
      assume(file).to.be.a('string');
      assume(file).to.include('test/fixtures/node_modules/test/custom.scss');
      done();
    });
  });

  it('imports files from node_module', function (done) {
    imports('test/file', fixtures, function ({ file } = {}) {
      assume(file).to.be.a('string');
      assume(file).to.include('test/fixtures/node_modules/test/file.scss');
      done();
    });
  });

  it('can be configured to import partial files without underscore', function (done) {
    imports = importer({ resolvers: ['partial'] }).bind({});

    imports('partial', fixtures, function ({ file } = {}) {
      assume(file).to.be.a('string');
      assume(file).to.include('test/fixtures/_partial.scss');
      done();
    });
  });

  it('resolves ~ to `node_modules`', function (done) {
    imports = importer({ ext: 'json' }).bind({});
    imports = importer({ resolvers: ['local', 'tilde'] }).bind({});

    imports('~diagnostics/package.json', fixtures, function ({ file } = {}) {
      assume(file).to.be.a('string');
      assume(file).to.include('node_modules/diagnostics/package.json');
      done();
    });
  });

  it('can resolve circular references', function (done) {
    sass.render({
      file: path.join(__dirname, 'fixtures', 'circular.scss'),
      importer: imports
    }, (err, result) => {
      const files = result.stats.includedFiles;
      const css = result.css.toString('utf-8');
      const check = [
        'sass-import-modules/test/fixtures/circular.scss',
        'sass-import-modules/test/fixtures/circles.scss',
        'sass-import-modules/circular.scss'
      ];

      assume(err).to.be.falsey();
      assume(css).to.include('.pi {\n  border: auto; }');
      assume(css).to.include('.radius {\n  width: 10; }');
      assume(files).to.be.an('array');

      check.forEach(file => {
        assume(files.some(f => ~f.indexOf(file))).to.be.true();
      });

      done();
    });
  });
});
