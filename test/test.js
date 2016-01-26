'use strict';

const importer = require('../src').importer;
const sass = require('node-sass');
const assume = require('assume');
const path = require('path');

const fixtures = path.join(__dirname, 'fixtures', 'index.scss');

describe('SASS import modules', function () {
  let imports;

  beforeEach(function () {
    imports = importer().bind({});
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