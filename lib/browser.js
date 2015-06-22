/*global SixSpeed */
var log = document.createElement('pre');
document.body.appendChild(log);

SixSpeed.run(window.location.hash.replace(/^#/, ""), function(message) {
  log.appendChild(document.createTextNode(message + '\n'));
});
