const minimist = require('minimist');

const knownOptions = {
  string: ['testName', 'type', 'count']
};

module.exports = minimist(process.argv.slice(2), knownOptions);
