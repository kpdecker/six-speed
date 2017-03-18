var data = {
  a: 'foo',
  b: {c: 'd'},
  arr: [1, 2, 3]
};

function fn() {
  var {a, b:{c:b}, arr:[, c]} = data;
  return a.length + b.length + c;
}

assertEqual(fn(), 6);
test(fn);
