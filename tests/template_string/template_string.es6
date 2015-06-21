var data = [1,2,3];
function fn() {
  return `${data[0]} ${data[1] + data[2]}`;
}

test(function() {
  fn();
});
