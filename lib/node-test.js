/*global SixSpeed */
var Fs = require('fs'),
    Path = require('path');

var $type = process.argv[2];

if ($type === 'babel') {
  require('babel-polyfill');
}
if ($type === 'traceur') {
  require('traceur/bin/traceur-runtime');
}
require('./runner');

var testDir = Path.join(__dirname, '..', 'build/tests');
Fs.readdirSync(testDir).forEach(function(test) {
  if (test.indexOf($type + '.js') < 0) {
    return;
  }

  try {
    require(Path.join(testDir, test));
  } catch (err) {
    // NOP: Init errors should have been caught bo the master process init
  }
});

process.on('message', function(exec) {
  SixSpeed.benchTest(exec.name, $type, function(result) {
    process.send({result: result});
  });
});
