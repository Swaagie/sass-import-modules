'use strict';

const importer = require('../index').importer;
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
});