const _ = require('lodash');
const Babel = require('@babel/core');
const Esprima = require('esprima');
const Fs = require('fs');
const Gulp = require('gulp');
const Vinyl = require('vinyl');
const PluginError = require('plugin-error');
const Handlebars = require('handlebars');
const Path = require('path');
const Through = require('through2');
const TypeScript = require('typescript');
const webpack = require('webpack');
const benchTemplate = Handlebars.compile(Fs.readFileSync(`${__dirname}/bench.handlebars`).toString());
const profileTemplate = Handlebars.compile(Fs.readFileSync(`${__dirname}/profile.handlebars`).toString());
const Log = require('fancy-log');

const closureExterns =
    '/** @param {function()} fn */ function test(fn) {}\n' +
    '/** @param {...*} var_args */ function assertEqual(var_args) {}\n';

Gulp.task('build', ['build:browser']);

Gulp.task('build:webpack', callback => {
  webpack({
    entry: './lib/runner',
    output: {
      path: 'build/',
      filename: 'runner.js'
    },
    externals: {
      lodash: '_',
      benchmark: 'Benchmark'
    },
    module: {
      loaders: [{
        test: /\.jsx?$/,
        exclude: /node_modules|vendor/,
        loader: 'babel-loader'
      }]
    }
  }, (err, stats) => {
      if (err) {
        throw new PluginError('webpack', err);
      }
      Log('[webpack]', stats.toString({timings: true, chunks: false}));
      callback();
  });
});

Gulp.task('build:tests', () => {
  const scripts = [
    'runner.js'
  ];

  return Gulp.src('tests/*')
    .pipe(Through.obj(function(testDir, dirEnc, dirCallback) {
      if (!testDir.isDirectory()) {
        return dirCallback();
      }

      const testName = Path.basename(testDir.path);

      Gulp.src(`${testDir.path}/*.*`)
          .pipe(Through.obj(({path, contents}, enc, fileCallback) => {
        const self = this;
        const ext = Path.extname(path).replace(/^\./, '');
        const content = contents.toString();

        function createFile(testType, src) {
          const fileName = `tests/${testName}__${testType}.js`;

          if (testType !== 'es6') {
            try {
              // If esprima can parse, then assume that it should work under es5
              Esprima.parse(src);
            } catch (err) {
              if (!(/Unexpected token/.test(err)) && !(/Invalid regular expression/.test(err))
                  && !(/Use of future reserved word in strict mode/.test(err))) {
                throw new Error(err);
              }
              return;
            }
          }

          src = `function(test, testName, testType, require, assertEqual) {${src}}`;
          scripts.push(fileName);
          self.push(new Vinyl({
            path: fileName,
            contents: new Buffer(
              `"use strict";\nSixSpeed.tests[${JSON.stringify(testName)}] = SixSpeed.tests[${JSON.stringify(testName)}] || {};\nSixSpeed.tests[${JSON.stringify(testName)}][${JSON.stringify(testType)}] = ${src};\n`)
          }));
        }

        if (ext === 'es6') {
          const babel = Babel.transform(content, {
            presets: [
              ['@babel/preset-env']
            ]
          }).code;

          const babelRuntime = Babel.transform(content, {
            presets: [
              ['@babel/preset-env']
            ],
            plugins: [
              ['@babel/plugin-transform-runtime']
            ]
          }).code;

          const babelLoose = Babel.transform(content, {
            presets: [
              ['@babel/preset-env', { loose: true }]
            ],
            plugins: [
              ['@babel/plugin-transform-runtime']
            ]
          }).code;

          createFile('babel', babel);
          if (babel !== babelRuntime) {
            createFile('babel-runtime', babelRuntime);
          }
          if (babel !== babelLoose) {
            createFile('babel-loose', babelLoose);
          }

          createFile('babel', babel);
          if (babel !== babelRuntime) {
            createFile('babel-runtime', babelRuntime);
          }
          if (babel !== babelLoose) {
            createFile('babel-loose', babelLoose);
          }

          createFile('typescript', TypeScript.transpile(content, { module: TypeScript.ModuleKind.CommonJS }));
        }
        createFile(ext, content);

        fileCallback();
      },
          cb => {
            cb();
            dirCallback();
          }));
    }))
    .pipe(Gulp.dest('build/'));
});

Gulp.task('build:browser-runner', () => Gulp.src([
      'lib/redirect-stable.html',
      'lib/redirect-prerelease.html',
      'lib/browser.js',
      'lib/browser-profile.js',
      'lib/iframe.js',
      'lib/worker.js',
      'lib/worker-test.js',
      require.resolve('benchmark'),
      require.resolve('lodash/lodash'),
      require.resolve('@babel/polyfill/dist/polyfill')
    ])
    .pipe(Gulp.dest('build')));

Gulp.task('build:browser', ['build:browser-runner', 'build:webpack', 'build:tests'], () => {
  const scripts = [
    'lodash.js',
    'benchmark.js',
    'runner.js'
  ];

  return Gulp.src('build/tests/*.*')
    .pipe(Through.obj((testDir, dirEnc, callback) => {
      if (!testDir.isDirectory()) {
        scripts.push(`tests/${Path.basename(testDir.path)}`);
      }
      return callback();
    },
    function(callback) {
      const types = {};
      _.each(scripts, script => {
        if ((/.*__(.*)\.js$/).exec(script)) {
          let type = types[RegExp.$1];
          if (!type) {
            type = types[RegExp.$1] = [];

            type.push('lodash.js');
            type.push('benchmark.js');
            if (RegExp.$1 === 'babel') {
              type.push('polyfill.js');
            }
            type.push('runner.js');
          }
          type.push(script);
        }
      });
      scripts.push('worker.js');
      scripts.push('browser.js');

      this.push(new Vinyl({
        path: 'index.html',
        contents: new Buffer(benchTemplate({scripts}))
      }));

      // We need a special mime type to enable all of the features on Firefox.
      const mozScripts = _.map(scripts, script => `../${script}`);
      mozScripts[mozScripts.length - 2] = '../iframe.js';
      this.push(new Vinyl({
        path: 'moz/index.html',
        contents: new Buffer(benchTemplate({
          scripts: mozScripts,
          jsType: 'application/javascript;version=1.7'
        }))
      }));

      _.each(types, (scripts, name) => {
        const workerScripts = scripts.concat('worker-test.js');
        this.push(new Vinyl({
          path: `${name}.js`,
          contents: new Buffer(
            `$type = ${JSON.stringify(name)};\n${workerScripts.map(script => `try { importScripts(${JSON.stringify(script)}); } catch (err) { console.log(${JSON.stringify(script)} + err); }`).join('\n')}`)
        }));

        // We need a special mime type to enable all of the features on Firefox.
        const mozScripts = _.map(scripts, script => `../${script}`);
        this.push(new Vinyl({
          path: `moz/${name}.html`,
          contents: new Buffer(benchTemplate({scripts: mozScripts, jsType: 'application/javascript;version=1.7'}))
        }));
      });


      scripts[scripts.length - 1] = 'browser-profile.js';
      this.push(new Vinyl({
        path: 'profile.html',
        contents: new Buffer(profileTemplate({scripts}))
      }));

      // We need a special mime type to enable all of the features on Firefox.
      this.push(new Vinyl({
        path: 'moz/profile.html',
        contents: new Buffer(profileTemplate({
          scripts: _.map(scripts, script => `../${script}`),
          jsType: 'application/javascript;version=1.7'
        }))
      }));

      callback();
    }))
    .pipe(Gulp.dest('build/'));
});
