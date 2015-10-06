/*global document, location, navigator, SixSpeed, XMLHttpRequest */
var log = document.createElement('pre');
document.body.appendChild(log);

var tag = (/tag=([^&]*)/.exec(location.search) || [])[1];

var grep = location.hash.replace(/^#/, ''),
    vms = {};
SixSpeed.bench({
  grep: grep,
  log: function(message) {
    log.appendChild(document.createTextNode(message + '\n'));

    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {};
    request.open('POST', '/debug', true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send('browser=' + encodeURIComponent(navigator.userAgent) + (tag ? '&tag=' + tag : '') + '&message=' + encodeURIComponent(message));
  },
  testDone: function() {
    // Sending this frequently, the data store will handle deduping, etc.
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {};
    request.open('POST', '/log', true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send('browser=' + encodeURIComponent(navigator.userAgent) + (tag ? '&tag=' + tag : '') + '&data=' + encodeURIComponent(JSON.stringify(SixSpeed.stats)));
  },
  done: function() {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {};
    request.open('POST', '/done', true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send();
  },

  runTest: runTest
});
