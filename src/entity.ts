/* Copyright (c) 2010-2022 Richard Rodger and other contributors, MIT License */

import {
  EntityState
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
    .add('sys:entity,hook:intercept,intercept:act_error', hook_intercept_act_error)


  // Stores are responsible for calling transaction rollback on errors.
  function hook_intercept_act_error(this: any, msg: any, reply: any, meta: any) {
    let action = msg.action
    if ('function' != typeof action) {
      throw new Error('intercept action parameter must be a function')
    }

    this.private$.intercept.act_error.push(action)
    let act_errors =
      this.private$.intercept.act_error.map((action: any) => action.name)

    reply({ act_errors })
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

    let entityAPI: any = function entityAPI(this: any) {
      return seneca.private$.entity.make$(this, ...[...arguments, promise])
    }

    // TODO: message to inject direct function call for rollbacks
    // to be called in intercept act_error, keyed by canonstr


    entityAPI.instance = function(this: any) {
      let emptyEntity = this()
      let instance = emptyEntity.private$.get_instance()
      return instance
    }


    entityAPI.state = function(canonspec: any) {
      let emptyEntity = this()
      return get_state(emptyEntity, canonspec)
    }


    if (opts.transaction.active) {

      entityAPI.begin = async function(this: any, canonspec: any, extra: any) {
        let emptyEntity = this()
        let state = get_state(emptyEntity, canonspec)

        let result: any = await new Promise((res, rej) => {
          state.instance.act(
            'sys:entity,transaction:begin', { ...state.canon, ...(extra || {}) },
            function(err: any, out: any) {
              return err ? rej(err) : res(out)
            }
          )
        })

        let { get_handle } = result

        let transaction: any = {
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

        // Generate correct get_instance referencing transactionInstance
        transactionInstance.entity()

        return transactionInstance
      }


      entityAPI.end = async function(this: any, canonspec: any, extra: any) {
        let emptyEntity = this()
        let state = get_state(emptyEntity, canonspec)

        let transaction =
          state.instance.fixedmeta.custom.sys__entity.transaction[state.canonstr]

        if (transaction) {
          let details = () => transaction

          let get_result: any = await new Promise((res, rej) => {
            state.instance.act(
              'sys:entity,transaction:end',
              {
                ...state.canon,
                ...(extra || {}),
                details,
              },
              function(err: any, out: any) {
                return err ? rej(err) : res(out)
              }
            )
          })

          transaction.result = get_result()
          transaction.finish = Date.now()

          delete state.instance.fixedmeta.custom.sys__entity.transaction[state.canonstr]
        }

        return transaction
      }


      entityAPI.rollback = async function(this: any, canonspec: any, extra: any) {
        let emptyEntity = this()
        let state = get_state(emptyEntity, canonspec)

        let transaction =
          state.instance.fixedmeta.custom.sys__entity.transaction[state.canonstr]

        let details = () => transaction

        let canon = MakeEntity.parsecanon(canonspec)
        let result = await new Promise((res, rej) => {
          state.instance.act(
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

        delete state.instance.fixedmeta.custom.sys__entity.transaction[state.canonstr]

        return transaction
      }


      entityAPI.adopt = async function(
        this: any,
        handle: any,
        canonspec: any,
        extra: any
      ) {
        let emptyEntity = this()
        let state = get_state(emptyEntity, canonspec)

        let transaction =
          state.instance.fixedmeta.custom.sys__entity.transaction[state.canonstr]

        if (transaction) {
          let err = new Error('Transaction already exists for canon ' + state.canonstr)
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

        // Generate correct get_instance referencing transactionInstance
        transactionInstance.entity()

        return transactionInstance
      }
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


// Get the current entity instance and transaction state
function get_state(emptyEntity: any, canonspec: any): EntityState {
  let instance = emptyEntity.private$.get_instance()
  let canon = MakeEntity.parsecanon(canonspec)
  let canonstr = MakeEntity.canonstr(canon)
  let transaction = instance.fixedmeta.custom.sys__entity.transaction[canonstr]

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

