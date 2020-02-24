'use strict';
const buildResponseData = require('./data-builder');
const safeStringify = require('fast-safe-stringify');

module.exports = function(options) {
  return function strongErrorHandler(err, req, res, next) {
    options = options || {};
    if (!err.status && !err.statusCode && res.statusCode >= 400)
      err.statusCode = res.statusCode;
    const data = buildResponseData(err, options);
    res.statusCode = data.code;
    const content = safeStringify({error: data});
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(content, 'utf-8');
    next();
  };
};
