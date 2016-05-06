/*global SixSpeed */
var Args = require('./args'),
    Path = require('path');

if (Args.type === 'babel') {
  require('babel-polyfill');
}
if (Args.type === 'traceur') {
  require('traceur/bin/traceur-runtime');
}
require('./runner');

var testFile = Path.join(__dirname, '..', 'build/tests', Args.testName + '__' + Args.type);
require(testFile);

console.log('Running', Args.testName + '-' + Args.type, 'for', Args.count, 'iterations');

SixSpeed.profile(Args.testName, Args.type, parseInt(Args.count, 10));
