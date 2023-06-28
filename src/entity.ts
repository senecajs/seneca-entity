/* Copyright (c) 2010-2023 Richard Rodger and other contributors, MIT License */


import {
  EntityState,
  CanonSpec,
} from './types'


import { MakeEntity, Entity } from './lib/make_entity'
import { Store } from './lib/store'



// Define the entity plugin.
function entity(this: any, options: any) {
  // const seneca = this
}


entity.defaults = {
  mem_store: true,
  generate_id,

  pattern_fix: { sys: 'entity' },

  // Control stringification of entities
  jsonic: {
    depth: 7,
    maxitems: 11,
    maxchars: 111,
  },

  log: {
    active: false,
  },

  // hide: Open({}),

  meta: {
    // Provide action meta object as third argument to callbacks.
    provide: true,
  },
}


// All functionality should be loaded when defining plugin
function preload(this: any, context: any) {
  const seneca = this

  const options = context.options

  seneca.util.parsecanon = seneca.util.parsecanon || MakeEntity.parsecanon

  // Create entity delegate.
  const sd = seneca.delegate()

  // Template entity that makes all others.
  seneca.private$.entity =
    seneca.private$.entity || MakeEntity({}, sd, options)

  // Expose the Entity object so third-parties can do interesting things with it
  seneca.private$.exports.Entity =
    seneca.private$.exports.Entity || Entity

  function build_api_make(promise: boolean) {

    let entityAPI = function entityAPI(this: any) {
      let ent = seneca.private$.entity.make$(this, ...[...arguments, promise])
      return ent
    }

    return entityAPI
  }


  let make = build_api_make(false)

  let entity = build_api_make(true)

  if (!seneca.make$) {
    seneca.decorate('make$', make)
  }

  if (!seneca.make) {
    seneca.decorate('make', make)
  }

  if (!seneca.entity) {
    seneca.decorate('entity', entity)
  }


  // Backwards compatibility
  seneca
    .translate('role:entity,cmd:load', 'sys:entity')
    .translate('role:entity,cmd:save', 'sys:entity')
    .translate('role:entity,cmd:list', 'sys:entity')
    .translate('role:entity,cmd:remove', 'sys:entity')

  const store = Store(options)


  if (options.mem_store) {
    seneca.root.use(require('seneca-mem-store'))
  }

  if (options.log.active) {
    seneca.root.private$.exports.Entity.prototype.log$ = function(this: any) {
      // Use this, as make$ will have changed seneca ref.
      const seneca = this.private$.get_instance()
      seneca.log.apply(seneca, arguments)
    }
  }

  return {
    exports: {
      store: store,
      init: store.init,
      generate_id: options.generate_id.bind(seneca),
    }
  }
}


entity.preload = preload


// cache nid funcs up to length 64
const nidCache: any = []


function generate_id(this: any, msg: any, reply: any) {
  let seneca = this
  let Nid = seneca.util.Nid

  let actnid = null == msg ? Nid({}) : null

  if (null == actnid) {
    const length =
      'object' === typeof msg
        ? parseInt(msg.length, 10) || 6
        : parseInt(msg, 10)

    if (length < 65) {
      actnid = nidCache[length] || (nidCache[length] = Nid({ length: length }))
    } else {
      actnid = Nid({ length: length })
    }
  }

  return reply ? reply(actnid()) : actnid()
}


export type { Entity }

export default entity

if ('undefined' !== typeof (module)) {
  module.exports = entity
}

