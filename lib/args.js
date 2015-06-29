var minimist = require('minimist');

var knownOptions = {
  string: ['testName', 'type', 'count']
};

module.exports = minimist(process.argv.slice(2), knownOptions);
