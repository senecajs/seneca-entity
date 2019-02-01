/* Copyright (c) 2011-2017 Richard Rodger and other contributors, MIT License. */
'use strict'

var Nid = require('nid')

exports.arrayify = function() {
  return Array.prototype.slice.call(arguments[0], arguments[1])
}

// cache nid funcs up to length 64
var nids = []

exports.generate_id = function(msg, reply) {
  var actnid = null == msg ? Nid({}) : null

  if (null == actnid) {
    var length =
      'object' === typeof msg
        ? parseInt(msg.length, 10) || 6
        : parseInt(msg, 10)

    if (length < 65) {
      actnid = nids[length] || (nids[length] = Nid({ length: length }))
    } else {
      actnid = Nid({ length: length })
    }
  }

  return reply ? reply(actnid()) : actnid()
}
