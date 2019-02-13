/*global document */
let vms = vms || {};

function runTest(name, type, complete) {
  function doIt() {
    vm.contentWindow.SixSpeed.benchTest(name, type, result => {
      complete(result);
    }, true);
  }

  let vm = vms[type];
  if (!vm) {
    vm = vms[type] = document.createElement('iframe');
    vm.src = `${type}.html`;
    vm.onload = () => {
      doIt();
      vm.onload = undefined;
    };
    document.body.appendChild(vm);
  } else {
    doIt();
  }
}
