/*global document */
var vms = {};

function runTest(name, type, complete) {
  function doIt() {
    vm.contentWindow.SixSpeed.benchTest(name, type, function(result) {
      complete(result);
    }, true);
  }

  var vm = vms[type];
  if (!vm) {
    vm = vms[type] = document.createElement('iframe');
    vm.src = type + '.html';
    vm.onload = function() {
      doIt();
      vm.onload = undefined;
    };
    document.body.appendChild(vm);
  } else {
    doIt();
  }
}
