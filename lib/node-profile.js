/*global SixSpeed */
const Args = require('./args');
const Path = require('path');

if (Args.type === 'babel') {
  require('babel-polyfill');
}
require('./runner');

const testFile = Path.join(__dirname, '..', 'build/tests', `${Args.testName}__${Args.type}`);
require(testFile);

console.log('Running', `${Args.testName}-${Args.type}`, 'for', Args.count, 'iterations');

SixSpeed.profile(Args.testName, Args.type, parseInt(Args.count, 10));
