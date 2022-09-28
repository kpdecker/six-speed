const _ = require('lodash');
const Args = require('../lib/args');
const ChildProcess = require('child_process');
const Gulp = require('gulp');
const PluginError = require('plugin-error');

Gulp.task('test:node', Gulp.series('build:tests', async (callback) => {
  return findStagingArgs(args => {
    args.push('lib/node');
    runNode(args, callback);
  });
}));

Gulp.task('profile:node', Gulp.series('build:tests', (callback) => {
  return findStagingArgs(args => {
    args.push('--prof');
    args.push('lib/node-profile');
    args.push(`--testName=${Args.testName}`);
    args.push(`--type=${Args.type}`);
    args.push(`--count=${Args.count}`);

    runNode(args, callback);
  });
}));

function findStagingArgs(callback) {
  ChildProcess.exec('node  --v8-options | grep "in progress"', (err, stdout) => {
    if (err && err.code !== 1) {
      throw new PluginError('test:node', err);
    }

    // Run with everything enabled, per https://iojs.org/en/es6.html
    const args = _.compact(stdout.replace(/\n$/, '').split(/\n/g).map(line => {
      if (/(--\w+)/.exec(line)) {
        return RegExp.$1;
      }
    }));
    args.push('--harmony');
    callback(args);
  });
}

function runNode(args, callback) {
  const test = ChildProcess.spawn('node', args, {stdio: 'inherit'});
  test.on('close', code => {
    if (code) {
      throw new PluginError('test:node', `Exited with code: ${code}`);
    }

    callback();
  });
}
