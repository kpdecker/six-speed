/*global document, location, SixSpeed */
const queryParams = {};
location.search.replace(/^\?/, '').split(/&/g).forEach(pair => {
  pair = pair.split(/=/);
  queryParams[pair[0]] = pair[1];
});

const testName = queryParams.testName;
const testType = queryParams.type;
const iterationCount = parseInt(queryParams.count, 0);

if (testName && testType && iterationCount) {
  document.getElementById('info').appendChild(document.createTextNode(`Profile ${testName} ${testType} executing ${iterationCount} operations`));
} else {
  document.getElementById('info').appendChild(document.createTextNode('Must specify testName, type, and count parameters'));
}

function doIt() {
  SixSpeed.profile(testName, testType, iterationCount);
}
