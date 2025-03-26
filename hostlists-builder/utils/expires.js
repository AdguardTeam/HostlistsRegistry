/**
 * Parses "Expires" field and converts it to seconds
 *
 * @param expires
 */
module.exports = function (expires) {
  if (expires) {
    if (expires.indexOf('day') > 0) {
      expires = parseInt(expires, 10) * 24 * 60 * 60;
    } else if (expires.indexOf('hour') > 0) {
      expires = parseInt(expires, 10) * 60 * 60;
    }
    if (Number.isNaN(expires)) {
      // Default
      expires = 86400;
    }
  }
  return expires || 86400;
};
