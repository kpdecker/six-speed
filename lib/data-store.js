const _ = require('lodash');
const Fs = require('fs');
const dataFile = `${__dirname}/../data.json`;
const notesFile = `${__dirname}/../notes.json`;

module.exports.load = () => JSON.parse(Fs.readFileSync(dataFile).toString());

module.exports.notes = () => JSON.parse(Fs.readFileSync(notesFile).toString());

module.exports.store = function(browser, tag, version, stats) {
  const data = this.load();

  tag = tag || version;

  data[browser] = data[browser] || {};
  data[browser][tag] = data[browser][tag] || {stats: {}};
  data[browser][tag].version = version;

  _.extend(data[browser][tag].stats, stats);

  Fs.writeFileSync(dataFile, JSON.stringify(data, undefined, 2));
};
