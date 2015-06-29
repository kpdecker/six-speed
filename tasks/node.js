var _ = require('lodash'),
    ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    GUtil = require('gulp-util');

Gulp.task('test:node', ['build:tests'], function(callback) {
  ChildProcess.exec('node  --v8-options | grep "in progress"', function(err, stdout) {
    if (err && err.code !== 1) {
      throw new GUtil.PluginError('test:node', err);
    }

    // Run with everything enabled, per https://iojs.org/en/es6.html
    var args = _.compact(stdout.replace(/\n$/, '').split(/\n/g).map(function(line) {
      if (/(--\w+)/.exec(line)) {
        return RegExp.$1;
      }
    }));
    if (/^0/.test(process.versions.node)) {
      args.push('--harmony');
    } else {
      args.push('--es_staging');
    }
    args.push('lib/node');

    var test = ChildProcess.spawn('node', args, {stdio: 'inherit'});
    test.on('close', function(code) {
      if (code) {
        throw new GUtil.PluginError('test:node', 'Exited with code: ' + code);
      }

      callback();
    });
  });
});
