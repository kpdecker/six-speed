var Fs = require('fs');

module.exports.store = function(browser, version, stats) {
  var dataFile = __dirname + '/../data.json',
      data = JSON.parse(Fs.readFileSync(dataFile).toString());

  data[browser] = data[browser] || {};
  data[browser][version] = stats;

  Fs.writeFileSync(dataFile, JSON.stringify(data, undefined, 2));
};
