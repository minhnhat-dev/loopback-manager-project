
'use strict';

const httpStatus = require('http-status');

module.exports = buildResponseData;

function buildResponseData(err, options) {
  console.log('err', err);
  if (Array.isArray(err)) {
    return serializeArrayOfErrors(err, options);
  }

  const data = Object.create(null);
  fillStatusCode(data, err);

  if (typeof err !== 'object') {
    err = {
      code: 500,
      message: '' + err,
    };
  }

  if (data.code >= 400 && data.code <= 499) {
    fillBadRequestError(data, err);
  } else {
    fillInternalError(data, err);
  }

  const safeFields = options.safeFields || [];
  fillSafeFields(data, err, safeFields);

  return data;
}

function serializeArrayOfErrors(errors, options) {
  const details = errors.map(e => buildResponseData(e, options));
  return {
    code: 500,
    message: 'Failed with multiple errors, ' +
      'see `details` for more information.',
    details: details,
  };
}

function fillStatusCode(data, err) {
  data.code = err.code || err.status;
  if (!data.code || data.code < 400)
    data.code = 500;
}

function fillBadRequestError(data, err) {
  data.name = err.name;
  data.message = err.message;
  data.code = err.code;
  data.details = err.details;
}

function fillInternalError(data, err) {
  data.message = httpStatus[data.code] || 'Unknown Error';
}

function fillSafeFields(data, err, safeFields) {
  if (!Array.isArray(safeFields)) {
    safeFields = [safeFields];
  }

  safeFields.forEach(function(field) {
    if (err[field] !== undefined) {
      data[field] = err[field];
    }
  });
}
