/*global Worker */
const vms = {};
function runTest(name, type, complete) {
  function doIt() {
    vm.onmessage = ({data}) => {
      vm.onmessage = undefined;
      complete(data.result || data);
    };
    vm.postMessage({name});
  }

  var vm = vms[type];
  if (!vm) {
    vm = vms[type] = new Worker(`${type}.js`);
  }
  doIt();
}
