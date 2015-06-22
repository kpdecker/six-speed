var data = [1,2,3];

test(function() {
  var ret = '';
  for (var value of data) {
    ret += value;
  }
  return ret;
});
