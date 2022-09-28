
module.exports.parse = userAgent => {
  let browserName = userAgent;
  let browserVersion = 'unknown';

  if (userAgent.match(/Edg\/(\S+)/)) {
    browserName = 'edge';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/MSIE ([\.\d]+)/)) {
    browserName = 'ie';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/Trident\/.*rv:([\.\d]+)/)) {
    browserName = 'ie';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/Firefox\/(\S+)/)) {
    browserName = 'firefox';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/Chrome\/(\S+)/)) {
    browserName = 'chrome';
    browserVersion = RegExp.$1;
  } else if (userAgent.match(/AppleWebKit\/(\S+)/)) {
    // Some strain of webkit
    browserName = 'webkit';
    browserVersion = RegExp.$1;

    // Check to see if the Safari version matches. If so then we are running a formal
    // release.
    // Isn't user agent parsing fun
    if (userAgent.match(/Safari\/(\S+)/)
        && RegExp.$1 === browserVersion
        && userAgent.match(/Version\/(\S+)/)) {
      browserName = 'safari';
      browserVersion = RegExp.$1;
    }
  }

  return {name: browserName, version: browserVersion};
};
