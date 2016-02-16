'use strict'

exports.arrayify = function () {
  return Array.prototype.slice.call(arguments[0], arguments[1])
}
