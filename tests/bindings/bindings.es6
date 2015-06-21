"use strict";

const a = 1;
let b = 2;

function fn() {
  return a + b;
}

test(function() {
  fn();
});
