/*global Worker */
var vms = {};
function runTest(name, type, complete) {
  function doIt() {
    vm.onmessage = function(m) {
      vm.onmessage = undefined;
      complete(m.data.result || m.data);
    };
    vm.postMessage({name: name});
  }

  var vm = vms[type];
  if (!vm) {
    vm = vms[type] = new Worker(type + '.js');
  }
  doIt();
}
