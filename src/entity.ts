/* Copyright (c) 2010-2022 Richard Rodger and other contributors, MIT License */


import { MakeEntity, Entity } from './lib/make_entity'
import { Store } from './lib/store'


const default_opts: any = {
  mem_store: true,
  server: false,
  client: false,
  generate_id,

  // Control stringification of entities
  jsonic: {
    depth: 7,
    maxitems: 11,
    maxchars: 111,
  },

  log: {
    active: false,
  },

  meta: {
    // Provide action meta object as third argument to callbacks.
    provide: true,
  },
}


/** Define the `entity` plugin. */
function entity() {
  return {
    name: 'entity',
  }
}


// All functionality should be loaded when defining plugin
function preload(this: any, context: any) {
  const seneca = this

  const { deep } = seneca.util

  const opts = deep({}, default_opts, context.options)


  const store = Store()

  // Removes dependency on seneca-basic
  // TODO: deprecate this
  seneca.add('role:basic,cmd:generate_id', generate_id)

  seneca.util.parsecanon = seneca.util.parsecanon || MakeEntity.parsecanon

  // Create entity delegate.
  const sd = seneca.delegate()

  // Template entity that makes all others.
  seneca.private$.entity = seneca.private$.entity || MakeEntity({}, sd, opts)

  // Expose the Entity object so third-parties can do interesting things with it
  seneca.private$.exports.Entity =
    seneca.private$.exports.Entity || Entity

  if (opts.log.active) {
    seneca.private$.exports.Entity.prototype.log$ = function(this: any) {
      // Use this, as make$ will have changed seneca ref.
      const seneca = this.private$.get_instance()
      seneca.log.apply(seneca, arguments)
    }
  }

  // all optional
  function build_api_make(promise: boolean) {
    let entityAPI: any = function(this: any) {
      return seneca.private$.entity.make$(this, ...[...arguments, promise])
    }

    entityAPI.begin = async function(this: any, canonspec: any, extra: any) {
      let emptyEntity = this()
      let instance = emptyEntity.private$.get_instance()

      let canon = MakeEntity.parsecanon(canonspec)
      let result: any = await new Promise((res, rej) => {
        instance.act(
          'sys:entity,transaction:begin', { ...canon, ...(extra || {}) },
          function(err: any, out: any) {
            return err ? rej(err) : res(out)
          }
        )
      })

      let { handle } = result

      let transaction: any = {
        start: Date.now(),
        begin: result,
        canon,
        handle,
        trace: [],
        id: instance.util.Nid()
      }

      let transactionInstance = instance.delegate(null, {
        custom: {
          sys__entity: {
            transaction
          }
        }
      })

      transaction.sid = transactionInstance.id
      transaction.did = transactionInstance.did

      // Generate correct get_instance referencing transactionInstance
      // TODO: refactor?
      transactionInstance.entity()

      return transactionInstance
    }


    entityAPI.end = async function(this: any, canonspec: any, extra: any) {
      let emptyEntity = this()
      let instance = emptyEntity.private$.get_instance()

      let transaction = instance.fixedmeta.custom.sys__entity.transaction

      if (transaction) {
        let details = () => transaction

        let canon = MakeEntity.parsecanon(canonspec)
        let result = await new Promise((res, rej) => {
          instance.act(
            'sys:entity,transaction:end',
            {
              ...canon,
              ...(extra || {}),
              details,
            },
            function(err: any, out: any) {
              return err ? rej(err) : res(out)
            }
          )
        })

        transaction.end = result
        transaction.finish = Date.now()

        delete instance.fixedmeta.custom.sys__entity.transaction
      }

      return transaction
    }


    entityAPI.rollback = async function(this: any, canonspec: any, extra: any) {
      let emptyEntity = this()
      let instance = emptyEntity.private$.get_instance()

      let transaction = instance.fixedmeta.custom.sys__entity.transaction
      let details = () => transaction

      let canon = MakeEntity.parsecanon(canonspec)
      let result = await new Promise((res, rej) => {
        instance.act(
          'sys:entity,transaction:rollback',
          {
            ...canon,
            ...(extra || {}),
            details,
          },
          function(err: any, out: any) {
            return err ? rej(err) : res(out)
          }
        )
      })

      transaction.end = result
      transaction.finish = Date.now()

      return transaction
    }


    entityAPI.active = function() {
      let emptyEntity = this()
      let instance = emptyEntity.private$.get_instance()

      let transaction = instance.fixedmeta.custom?.sys__entity?.transaction

      return transaction
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

  // TODO: make this work
  // if (!seneca.entity$) {
  //   seneca.decorate('entity$', entity)
  // }

  if (!seneca.entity) {
    seneca.decorate('entity', entity)
  }

  // Handle old versions of seneca where the
  // store init was already included by default.
  if (!seneca.store || !seneca.store.init) {
    seneca.decorate('store', store)
  }

  // Ensures legacy versions of seneca that load mem-store do not
  // crash the system. Seneca 2.x and lower loads mem-store by default.
  if (
    !seneca.options().default_plugins['mem-store'] &&
    opts.mem_store &&
    !opts.client
  ) {
    seneca.root.use(require('seneca-mem-store'))
  }

  // FIX: does not work! need to invert this so
  // older stuff hits role then sys

  // Prepare transition from role: to sys:
  this.translate('sys:entity,cmd:load', 'role:entity')
    .translate('sys:entity,cmd:save', 'role:entity')
    .translate('sys:entity,cmd:list', 'role:entity')
    .translate('sys:entity,cmd:remove', 'role:entity')

  if (opts.client) {
    this.translate('role:entity,cmd:load', 'role:remote-entity')
      .translate('role:entity,cmd:save', 'role:remote-entity')
      .translate('role:entity,cmd:list', 'role:remote-entity')
      .translate('role:entity,cmd:remove', 'role:remote-entity')

    this.translate('sys:entity,cmd:load', 'sys:remote-entity')
      .translate('sys:entity,cmd:save', 'sys:remote-entity')
      .translate('sys:entity,cmd:list', 'sys:remote-entity')
      .translate('sys:entity,cmd:remove', 'sys:remote-entity')
  } else if (opts.server) {
    this.translate('role:remote-entity,cmd:load', 'role:entity')
      .translate('role:remote-entity,cmd:save', 'role:entity')
      .translate('role:remote-entity,cmd:list', 'role:entity')
      .translate('role:remote-entity,cmd:remove', 'role:entity')

    this.translate('sys:remote-entity,cmd:load', 'sys:entity')
      .translate('sys:remote-entity,cmd:save', 'sys:entity')
      .translate('sys:remote-entity,cmd:list', 'sys:entity')
      .translate('sys:remote-entity,cmd:remove', 'sys:entity')
  }

  return {
    name: 'entity',
    exports: {
      store: store,
      init: store.init,
      generate_id: opts.generate_id.bind(seneca),
    },
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

