/*global document, location, navigator, SixSpeed, XMLHttpRequest */
const log = document.createElement('pre');
document.body.appendChild(log);

const tag = (/tag=([^&]*)/.exec(location.search) || [])[1];

const grep = location.hash.replace(/^#/, '');
var vms = {};

SixSpeed.bench({
  grep,
  log(message) {
    log.appendChild(document.createTextNode(`${message}\n`));

    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {};
    request.open('POST', '/debug', true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send(`browser=${encodeURIComponent(navigator.userAgent)}${tag ? `&tag=${tag}` : ''}&message=${encodeURIComponent(message)}`);
  },
  testDone() {
    // Sending this frequently, the data store will handle deduping, etc.
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {};
    request.open('POST', '/log', true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send(`browser=${encodeURIComponent(navigator.userAgent)}${tag ? `&tag=${tag}` : ''}&data=${encodeURIComponent(JSON.stringify(SixSpeed.stats))}`);
  },
  done() {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {};
    request.open('POST', '/done', true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send();
  },

  runTest
});
