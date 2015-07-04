
onmessage = function(exec) {
  SixSpeed.benchTest(exec.data.name, $type, function(result) {
    postMessage({result: result});
  });
};
