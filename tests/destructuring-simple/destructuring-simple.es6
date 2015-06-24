var data = {
  a: 'foo',
  b: {c: 'd'},
  arr: [1, 2, 3]
};

test(function() {
  var {a, b} = data;
  return a;
});
