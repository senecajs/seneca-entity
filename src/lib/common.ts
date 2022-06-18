/* Copyright (c) 2011-2022 Richard Rodger and other contributors, MIT License. */


import Nid from 'nid'

// function arrayify() {
//   return Array.prototype.slice.call(arguments[0], arguments[1])
// }

// cache nid funcs up to length 64
var nids: any = []

function generate_id(msg: any, reply: any) {
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


export {
  generate_id,
}
