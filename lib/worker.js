/*global Worker */
var vms = {};

function runTest(name, type, complete) {
  if (window.Worker !== undefined) {
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
  } else {
    SixSpeed.benchTest(name, type, result => {
      setTimeout(() => {
        complete(result);
      }, 0);
    });
  }
}
