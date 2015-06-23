
module.exports.parse = function(userAgent) {
  var browserName = userAgent,
      browserVersion = 'unknown';

  if (userAgent.match(/MSIE ([\.\d]+)/)) {
    browserName = 'internet explorer';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/Trident\/.*rv:([\.\d]+)/)) {
    browserName = 'internet explorer';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/(Edge|Firefox)\/(\S+)/)) {
    browserName = RegExp.$1.toLowerCase();
    browserVersion = RegExp.$2;
  } else if (userAgent.match(/Chrome\/(\S+)/)) {
    browserName = 'chrome';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/Safari\/\S+/) && userAgent.match(/Version\/(\S+)/)) {
    browserName = 'safari';
    browserVersion = RegExp.$1;
  }

  return {name: browserName, version: browserVersion};
};
