/*global SixSpeed */
const Fs = require('fs');
const Path = require('path');
const $type = process.argv[2];

if ($type === 'babel') {
  require('babel-polyfill');
}
require('./runner');

const testDir = Path.join(__dirname, '..', 'build/tests');
Fs.readdirSync(testDir).forEach(test => {
  if (!test.includes(`${$type}.js`)) {
    return;
  }

  try {
    require(Path.join(testDir, test));
  } catch (err) {
    // NOP: Init errors should have been caught bo the master process init
  }
});

process.on('message', ({name}) => {
  SixSpeed.benchTest(name, $type, result => {
    process.send({result});
  });
});
