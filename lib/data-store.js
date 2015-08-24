var _ = require('lodash'),
    Fs = require('fs');

var dataFile = __dirname + '/../data.json',
    notesFile = __dirname + '/../notes.json';

module.exports.load = function() {
  return JSON.parse(Fs.readFileSync(dataFile).toString());
};

module.exports.notes = function() {
  return JSON.parse(Fs.readFileSync(notesFile).toString());
};

module.exports.store = function(browser, version, stats, log) {
  var data = this.load();

  data[browser] = data[browser] || {};
  data[browser][version] = data[browser][version] || {stats: {}};

  if (log) {
    data[browser][version].log = log;
  }
  _.extend(data[browser][version].stats, stats);

  Fs.writeFileSync(dataFile, JSON.stringify(data, undefined, 2));
};
