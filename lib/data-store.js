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

module.exports.store = function(browser, tag, version, stats) {
  var data = this.load();

  tag = tag || version;

  data[browser] = data[browser] || {};
  data[browser][tag] = data[browser][tag] || {stats: {}};
  data[browser][tag].version = version;

  _.extend(data[browser][tag].stats, stats);

  Fs.writeFileSync(dataFile, JSON.stringify(data, undefined, 2));
};
