var data = {
  a: 'foo',
  b: {c: 'd'},
  arr: [1, 2, 3]
};

test(function() {
  var {a, b:{c:b}, arr:[, c]} = data;
  return a;
});
