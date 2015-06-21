var Fs = require('fs'),
    Path = require('path');

require('./runner');

var testDir = Path.join(__dirname, '..', 'build/tests');


Fs.readdirSync(testDir).forEach(function(test) {
  try {
    require(Path.join(testDir, test));
  } catch (err) {
    console.log('Failed to load', test, err);
  }
});


SixSpeed.run();
