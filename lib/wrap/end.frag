  /* istanbul ignore next */
  // support CommonJS, AMD & browser
  if (typeof exports === 'object')
    module.exports = Observable
  else if (typeof define === 'function' && define.amd)
    define(function() { return Observable })
  else
    window.Observable = Observable

})(typeof window != 'undefined' ? window : undefined);