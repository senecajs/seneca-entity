/* Copyright (c) 2011-2022 Richard Rodger and other contributors, MIT License. */

// TODO: get this from current Seneca instance
import Nid from 'nid'

// cache nid funcs up to length 64
const nids: any = []

function generate_id(msg: any, reply: any) {
  let actnid = null == msg ? Nid({}) : null

  if (null == actnid) {
    const length =
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

export { generate_id }
