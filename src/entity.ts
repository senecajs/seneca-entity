/* Copyright (c) 2010-2022 Richard Rodger and other contributors, MIT License */

import {
  EntityState,
  EntityAPI,
  CanonSpec,
  Transaction,
} from './lib/types'

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

  transaction: {
    active: false
  }
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
  seneca
    .add('role:basic,cmd:generate_id', generate_id)


  if (opts.transaction.active) {
    // Rollback any open transactions on current instance
    // if there is an action error.
    seneca.on('act-err', function entity_act_err(this: any, msg: any, err: any) {
      // Avoid death loop
      if ('sys' === msg.entity && 'rollback' === msg.transaction) {
        return
      }

      let instance = this
      let custom = instance?.fixedmeta?.custom
      let tmap = (custom?.sys__entity?.transaction) || {}
      let txs: any[] = Object.values(tmap)
      for (let tx of txs) {
        if (null != tx.finish) {
          continue
        }

        let get_transaction = () => tx
        let canon = tx.canon

        tx.finish = Date.now()

        instance.act(
          'sys:entity,transaction:rollback',
          {
            ...canon,
            get_transaction,
            msg,
            err,
          }, function(err: any, result: any) {
            // TODO: handle errors here and below, from rollback cmds
            tx.result = result
          })
      }
    })
  }

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

    let entityAPI = (function entityAPI(this: any) {
      // console.log('MAKE', this && this.did)
      let ent = seneca.private$.entity.make$(this, ...[...arguments, promise])
      // console.log('ENT', ent.private$.get_instance().did)
      return ent
    }) as EntityAPI


    entityAPI.instance = function(this: any) {
      let emptyEntity = this()
      let instance = emptyEntity.private$.get_instance()
      return instance
    }


    entityAPI.state = function(this: any, canonspec: CanonSpec) {
      let emptyEntity = this()
      return get_state(emptyEntity, canonspec)
    }


    entityAPI.begin = async function(
      this: any,
      canonspec: any,
      extra: any
    ) {
      if (!opts.transaction.active) {
        return null
      }

      let emptyEntity = this()
      let state = get_state(emptyEntity, canonspec)

      let transaction = state.transaction

      if (transaction && !transaction.finish) {
        let err = new Error('Transaction already exists' +
          (state.canonstr ? ` (${state.canonstr})` : ''))
          ; (err as any).transaction = transaction
        throw err
      }

      // NOTE: using Promise as seneca-promisify may not be loaded
      let result: any = await new Promise((res, rej) => {
        state.instance.act(
          'sys:entity,transaction:begin', { ...state.canon, ...(extra || {}) },
          function(err: any, out: any) {
            return err ? rej(err) : res(out)
          }
        )
      })

      let { get_handle } = result

      transaction = {
        sid: '',
        did: '',
        start: Date.now(),
        begin: result,
        canon: state.canon,
        handle: get_handle(),
        trace: [],
        id: state.instance.util.Nid()
      }

      let transactionInstance = state.instance.delegate(null, {
        custom: {
          sys__entity: {
            transaction: {
              [state.canonstr]: transaction
            }
          }
        }
      })

      transaction.sid = transactionInstance.id
      transaction.did = transactionInstance.did

      transactionInstance.entity = state.instance.entity.bind(transactionInstance)
      Object.assign(transactionInstance.entity, state.instance.entity)

      return transactionInstance
    }


    entityAPI.end = async function(this: any, canonspec: CanonSpec, extra: any) {
      if (!opts.transaction.active) {
        return null
      }

      let emptyEntity = this()
      let state = get_state(emptyEntity, canonspec)

      let transaction: Transaction =
        state.instance.fixedmeta.custom.sys__entity.transaction[state.canonstr]

      if (null == transaction) {
        throw new Error('Transaction does not exist' +
          (state.canonstr ? ` (${state.canonstr})` : ''))
      }

      let get_transaction = () => transaction

      transaction.finish = Date.now()

      let result: any = await new Promise((res, rej) => {
        state.instance.act(
          'sys:entity,transaction:end',
          {
            ...state.canon,
            ...(extra || {}),
            get_transaction,
          },
          function(err: any, out: any) {
            return err ? rej(err) : res(out)
          }
        )
      })

      transaction.result = result

      return transaction
    }


    entityAPI.rollback = async function(this: any, canonspec: CanonSpec, extra: any) {
      if (!opts.transaction.active) {
        return null
      }

      let emptyEntity = this()
      let state = get_state(emptyEntity, canonspec)

      let transaction: Transaction =
        state.instance.fixedmeta.custom.sys__entity.transaction[state.canonstr]

      if (null == transaction) {
        throw new Error('Transaction does not exist' +
          (state.canonstr ? ` (${state.canonstr})` : ''))
      }

      let get_transaction = () => transaction

      let canon = MakeEntity.parsecanon(canonspec)

      transaction.finish = Date.now()

      let result = await new Promise((res, rej) => {
        state.instance.act(
          'sys:entity,transaction:rollback',
          {
            ...canon,
            ...(extra || {}),
            get_transaction,
          },
          function(err: any, out: any) {
            return err ? rej(err) : res(out)
          }
        )
      })

      transaction.result = result


      return transaction
    }


    entityAPI.adopt = async function(
      this: any,
      handle: any,
      canonspec: any,
      extra: any
    ) {
      if (!opts.transaction.active) {
        return null
      }


      let emptyEntity = this()
      let state = get_state(emptyEntity, canonspec)

      let transaction =
        state.instance.fixedmeta.custom?.sys__entity?.transaction[state.canonstr]

      if (transaction && !transaction.finish) {
        let err = new Error('Transaction already exists' +
          (state.canonstr ? ` (${state.canonstr})` : ''))
          ; (err as any).transaction = transaction
        throw err
      }

      let result: any = await new Promise((res, rej) => {
        state.instance.act(
          'sys:entity,transaction:adopt', {
          ...state.canon,
          ...(extra || {}),
          get_handle: () => handle
        },
          function(err: any, out: any) {
            return err ? rej(err) : res(out)
          }
        )
      })

      let { get_handle } = result

      transaction = {
        start: Date.now(),
        begin: result,
        canon: state.canon,
        handle: get_handle(),
        trace: [],
        id: state.instance.util.Nid()
      }

      let transactionInstance = state.instance.delegate(null, {
        custom: {
          sys__entity: {
            transaction: {
              [state.canonstr]: transaction
            }
          }
        }
      })

      transaction.sid = transactionInstance.id
      transaction.did = transactionInstance.did

      transactionInstance.entity = state.instance.entity.bind(transactionInstance)
      Object.assign(transactionInstance.entity, state.instance.entity)

      return transactionInstance
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


// Get the current entity instance and transaction state
function get_state(emptyEntity: any, canonspec: CanonSpec): EntityState {
  let instance = emptyEntity.private$.get_instance()
  // console.log('GET_STATE', instance.did)

  let canon = MakeEntity.parsecanon(canonspec)
  let canonstr = MakeEntity.canonstr(canon)
  let custom = instance.fixedmeta.custom
  let transaction = (custom?.sys__entity?.transaction[canonstr]) || null

  return {
    when: Date.now(),
    instance,
    canon,
    canonstr,
    transaction,
  }
}


export type { Entity }

export default entity

if ('undefined' !== typeof (module)) {
  module.exports = entity
}

