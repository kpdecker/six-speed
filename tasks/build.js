var _ = require('lodash'),
    Babel = require('babel'),
    Fs = require('fs'),
    Gulp = require('gulp'),
    GUtil = require('gulp-util'),
    Handlebars = require('handlebars'),
    Path = require('path'),
    Through = require('through2'),
    Traceur = require('traceur'),
    TypeScript = require('typescript'),
    webpack = require('webpack');

var benchTemplate = Handlebars.compile(Fs.readFileSync(__dirname + '/bench.handlebars').toString()),
    profileTemplate = Handlebars.compile(Fs.readFileSync(__dirname + '/profile.handlebars').toString());

Gulp.task('build', ['build:browser']);

Gulp.task('build:webpack', function(callback) {
  webpack({
    entry: './lib/runner',
    output: {
      path: 'build/',
      filename: 'runner.js'
    },
    externals: {
      benchmark: 'Benchmark'
    },
    module: {
      loaders: [{
        test: /\.jsx?$/,
        exclude: /node_modules|vendor/,
        loader: 'babel-loader'
      }]
    }
  }, function(err, stats) {
      if (err) {
        throw new GUtil.PluginError('webpack', err);
      }
      GUtil.log('[webpack]', stats.toString());
      callback();
  });
});

Gulp.task('build:tests', function() {
  var scripts = [
    'runner.js'
  ];

  return Gulp.src('tests/*')
    .pipe(Through.obj(function(testDir, dirEnc, dirCallback) {
      if (!testDir.isDirectory()) {
        return dirCallback();
      }

      var testName = Path.basename(testDir.path);

      Gulp.src(testDir.path + '/*.*')
          .pipe(Through.obj(function(testFile, enc, fileCallback) {
            var ext = Path.extname(testFile.path).replace(/^\./, ''),
                content = testFile.contents.toString();

            function createFile(testType, src) {
              var fileName = 'tests/' + testName + '__' + testType + '.js';

              src = 'function(test, testName, testType, require, assertEqual) {' + src + '}';
              scripts.push(fileName);
              return new GUtil.File({
                path: fileName,
                contents: new Buffer(
                  '"use strict";\n'
                  + 'SixSpeed.tests[' + JSON.stringify(testName) + '] = SixSpeed.tests[' + JSON.stringify(testName) + '] || {};\n'
                  + 'SixSpeed.tests[' + JSON.stringify(testName) + '][' + JSON.stringify(testType) + '] = ' + src + ';\n')
              });
            }

            if (ext === 'es6') {
              var babel = Babel.transform(content, {optional: []}).code,
                  babelRuntime = Babel.transform(content, {optional: ['runtime']}).code,
                  babelLoose = Babel.transform(content, {loose: 'all', optional: ['runtime']}).code;
              this.push(createFile('babel', babel));
              if (babel !== babelRuntime) {
                this.push(createFile('babel-runtime', babelRuntime));
              }
              if (babel !== babelLoose) {
                this.push(createFile('babel-loose', babelLoose));
              }
              this.push(createFile('traceur', Traceur.compile(content)));

              var typeScript = TypeScript.transpile(content, { module: TypeScript.ModuleKind.CommonJS });
              this.push(createFile('typescript', typeScript));
            }
            this.push(createFile(ext, content));

            fileCallback();
          }.bind(this),
          function(cb) {
            cb();
            dirCallback();
          }));
    }))
    .pipe(Gulp.dest('build/'));
});

Gulp.task('build:browser-runner', function() {
  return Gulp.src([
        'lib/browser.js',
        'lib/browser-profile.js',
        'lib/iframe.js',
        'lib/worker.js',
        'lib/worker-test.js',
        require.resolve('benchmark'),
        require.resolve('babel-core/browser-polyfill'),
        require.resolve('traceur/bin/traceur-runtime')
      ])
      .pipe(Gulp.dest('build'));
});

Gulp.task('build:browser', ['build:browser-runner', 'build:webpack', 'build:tests'], function() {
  var scripts = [
    'benchmark.js',
    'traceur-runtime.js',
    'runner.js'
  ];

  return Gulp.src('build/tests/*.*')
    .pipe(Through.obj(function(testDir, dirEnc, callback) {
      if (!testDir.isDirectory()) {
        scripts.push('tests/' + Path.basename(testDir.path));
      }
      return callback();
    },
    function(callback) {
      var types = {};
      _.each(scripts, function(script) {
        if ((/.*__(.*)\.js$/).exec(script)) {
          var type = types[RegExp.$1];
          if (!type) {
            type = types[RegExp.$1] = [];

            type.push('benchmark.js');
            if (RegExp.$1 === 'traceur') {
              type.push('traceur-runtime.js');
            } else if (RegExp.$1 === 'babel') {
              type.push('browser-polyfill.js');
            }
            type.push('runner.js');
          }
          type.push(script);
        }
      });
      scripts.push('worker.js');
      scripts.push('browser.js');

      this.push(new GUtil.File({
        path: 'index.html',
        contents: new Buffer(benchTemplate({scripts: scripts}))
      }));

      // We need a special mime type to enable all of the features on Firefox.
      var mozScripts = _.map(scripts, function(script) { return '../' + script; });
      mozScripts[mozScripts.length - 2] = '../iframe.js';
      this.push(new GUtil.File({
        path: 'moz/index.html',
        contents: new Buffer(benchTemplate({
          scripts: mozScripts,
          jsType: 'application/javascript;version=1.7'
        }))
      }));

      _.each(types, function(scripts, name) {
        var workerScripts = scripts.concat('worker-test.js');
        this.push(new GUtil.File({
          path: name + '.js',
          contents: new Buffer(
            '$type = ' + JSON.stringify(name) + ';\n'
            + workerScripts.map(function(script) { return 'try { importScripts(' + JSON.stringify(script) + '); } catch (err) { console.log(' + JSON.stringify(script) + ' + err); }'; }).join('\n'))
        }));

        // We need a special mime type to enable all of the features on Firefox.
        var mozScripts = _.map(scripts, function(script) { return '../' + script; });
        this.push(new GUtil.File({
          path: 'moz/' + name + '.html',
          contents: new Buffer(benchTemplate({scripts: mozScripts, jsType: 'application/javascript;version=1.7'}))
        }));
      }, this);


      scripts[scripts.length - 1] = 'browser-profile.js';
      this.push(new GUtil.File({
        path: 'profile.html',
        contents: new Buffer(profileTemplate({scripts: scripts}))
      }));

      // We need a special mime type to enable all of the features on Firefox.
      this.push(new GUtil.File({
        path: 'moz/profile.html',
        contents: new Buffer(profileTemplate({
          scripts: _.map(scripts, function(script) { return '../' + script; }),
          jsType: 'application/javascript;version=1.7'
        }))
      }));

      callback();
    }))
    .pipe(Gulp.dest('build/'));
});
