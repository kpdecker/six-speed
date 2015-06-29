var _ = require('lodash'),
    Babel = require('babel'),
    Fs = require('fs'),
    Gulp = require('gulp'),
    GUtil = require('gulp-util'),
    Handlebars = require('handlebars'),
    Path = require('path'),
    Through = require('through2'),
    Traceur = require('traceur'),
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
              var fileName = 'tests/' + testName + '-' + testType + '.js';

              src = 'function(test, testName, testType, require) {' + src + '}';
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
              var babel = Babel.transform(content, {optional: ['runtime']}).code,
                  babelLoose = Babel.transform(content, {loose: 'all', optional: ['runtime']}).code;
              this.push(createFile('babel', babel));
              if (babel !== babelLoose) {
                this.push(createFile('babel-loose', babelLoose));
              }
              this.push(createFile('traceur', Traceur.compile(content)));
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
        'lib/native-features.js',
        require.resolve('benchmark'),
        require.resolve('traceur/bin/traceur-runtime')
      ])
      .pipe(Gulp.dest('build'));
});

Gulp.task('build:browser', ['build:browser-runner', 'build:webpack', 'build:tests'], function() {
  var scripts = [
    'native-features.js',
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
      scripts.push('browser.js');

      this.push(new GUtil.File({
        path: 'index.html',
        contents: new Buffer(benchTemplate({scripts: scripts}))
      }));

      // We need a special mime type to enable all of the features on Firefox.
      this.push(new GUtil.File({
        path: 'index-moz.html',
        contents: new Buffer(benchTemplate({scripts: scripts, jsType: 'application/javascript;version=1.7'}))
      }));


      scripts[scripts.length-1] = 'browser-profile.js';
      this.push(new GUtil.File({
        path: 'profile.html',
        contents: new Buffer(profileTemplate({scripts: scripts}))
      }));

      // We need a special mime type to enable all of the features on Firefox.
      this.push(new GUtil.File({
        path: 'profile-moz.html',
        contents: new Buffer(profileTemplate({scripts: scripts, jsType: 'application/javascript;version=1.7'}))
      }));

      callback();
    }))
    .pipe(Gulp.dest('build/'));
});
