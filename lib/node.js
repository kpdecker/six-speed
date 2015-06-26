/*global SixSpeed */
var DataStore = require('./data-store'),
    Fs = require('fs'),
    Path = require('path');

require('./native-features');   // Must occur prior to traceur runtime
require('traceur/bin/traceur-runtime');
require('./runner');

var testDir = Path.join(__dirname, '..', 'build/tests'),
    browserLog = [];


Fs.readdirSync(testDir).forEach(function(test) {
  try {
    require(Path.join(testDir, test));
  } catch (err) {
    var msg = 'Failed to load ' + test + ' ' + err;
    browserLog.push(msg);
    console.log(msg);
  }
});


SixSpeed.bench({
  done: function() {
    DataStore.store('node', process.versions.node, SixSpeed.stats, browserLog);
  }
});
