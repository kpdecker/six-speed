var list = [1, 2, 3];

function fn(a, b, c, d, e) {
  return c;
}

assertEqual(fn(), undefined);
// don't fail with no arguments.
assertEqual(fn(list), undefined);
// make sure that lists are not auto-spread.
assertEqual(fn(...list), 3);
// equivalent to fn(1, 2, 3);
assertEqual(fn(3, [2, 1, 0], ...list), 1);
// equivalent to fn(3, [2, 1, 0], 1, 2, 3); Makes sure that list arguments are not spread by default.
assertEqual(fn(0, ...list, 4), 2);
// equivalent to fn(0, 1, 2, 3, 4);

test(function() {
  fn();
  fn(...list);
  fn(3, [2, 1, 0], ...list);
  fn(0, ...list, 4);
});