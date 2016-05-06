function Fn() {
  return (this && new.target === Fn);
}

assertEqual(typeof (new Fn()), 'object');

test(function() {
  const f1 = Fn();
  const f2 = new Fn();
});
