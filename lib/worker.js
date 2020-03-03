/*global Worker */
var vms = {};

if (window.Worker != undefined) {
  function runTest(name, type, complete) {
    function doIt() {
      vm.onmessage = ({data}) => {
        vm.onmessage = undefined;
        complete(data.result || data);
      };
      vm.postMessage({name});
    }

    let vm = vms[type];
    if (!vm) {
      vm = vms[type] = new Worker(`${type}.js`);
    }
    doIt();
  }
} else {
  function runTest(name, type, complete) {
    SixSpeed.benchTest(name, type, result => {
      setTimeout(() => {
        complete(result);
      }, 0);
    });
  }
}
