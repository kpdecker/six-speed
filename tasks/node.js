const _ = require('lodash'),
    Args = require('../lib/args'),
    ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    PluginError = require('plugin-error');

Gulp.task('test:node', ['build:tests'], function(callback) {
  findStagingArgs(function(args) {
    args.push('lib/node');
    runNode(args, callback);
  });
});

Gulp.task('profile:node', ['build:tests'], function(callback) {
  findStagingArgs(function(args) {
    args.push('--prof');
    args.push('lib/node-profile');
    args.push('--testName=' + Args.testName);
    args.push('--type=' + Args.type);
    args.push('--count=' + Args.count);

    runNode(args, callback);
  });
});

function findStagingArgs(callback) {
  ChildProcess.exec('node  --v8-options | grep "in progress"', function(err, stdout) {
    if (err && err.code !== 1) {
      throw new PluginError('test:node', err);
    }

    // Run with everything enabled, per https://iojs.org/en/es6.html
    const args = _.compact(stdout.replace(/\n$/, '').split(/\n/g).map(function(line) {
      if (/(--\w+)/.exec(line)) {
        return RegExp.$1;
      }
    }));
    if (/^0/.test(process.versions.node)) {
      args.push('--harmony');
    } else {
      args.push('--es_staging');
    }
    callback(args);
  });
}

function runNode(args, callback) {
  const test = ChildProcess.spawn('node', args, {stdio: 'inherit'});
  test.on('close', function(code) {
    if (code) {
      throw new PluginError('test:node', 'Exited with code: ' + code);
    }

    callback();
  });
}
