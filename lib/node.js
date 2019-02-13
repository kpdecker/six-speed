/*global SixSpeed */
const _ = require('lodash');

const ChildProcess = require('child_process');
const DataStore = require('./data-store');
const Fs = require('fs');
const Path = require('path');

const nodeTestPath = require.resolve('./node-test');

require('./runner');

const testDir = Path.join(__dirname, '..', 'build/tests');
const browserLog = [];

Fs.readdirSync(testDir).forEach(test => {
  try {
    require(Path.join(testDir, test));
  } catch (err) {
    const msg = `Failed to load ${test} ${err}`;
    browserLog.push(msg);
    console.log(msg);
  }
});

let vms = vms || {};

SixSpeed.bench({
  concurrency: 2,

  done() {
    let tag = process.versions.node;
    if (/^(0\.\d+)/.exec(tag)) {
      tag = RegExp.$1;
    } else if (/^(\d+\.)/.exec(tag)) {
      tag = `${RegExp.$1}x`;
    }
    DataStore.store('node', tag, process.versions.node, SixSpeed.stats);

    _.each(vms, vm => {
      vm.kill();
    });
  },

  runTest(name, type, complete) {
    let vm = vms[type];
    if (!vm) {
      vm = vms[type] = ChildProcess.fork(nodeTestPath, [type]);
    }

    vm.once('message', ({result}) => {
      complete(result);
    });
    vm.send({name});
  }
});
