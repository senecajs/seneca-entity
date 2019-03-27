/* Copyright (c) 2010-2017 Richard Rodger and other contributors, MIT License */
'use strict'

var Common = require('./lib/common')
var MakeEntity = require('./lib/make_entity')
var Store = require('./lib/store')

var default_opts = {
  mem_store: true,
  server: false,
  client: false,
  generate_id: Common.generate_id,

  // Control stringification of entities
  jsonic: {
    depth: 7,
    maxitems: 33,
    maxchars: 1111
  }
}

module.exports = function entity() {
  return {
    name: 'entity'
  }
}

module.exports.intern = {
  store: Store.intern,
  common: Common
}

// All functionality should be loaded when defining plugin
module.exports.preload = function entity(context) {
  var seneca = this

  var opts = seneca.util.deepextend({}, default_opts, context.options)

  // Removes dependency on seneca-basic
  // TODO: deprecate this
  seneca.add('role:basic,cmd:generate_id', Common.generate_id)

  seneca.util.parsecanon = seneca.util.parsecanon || MakeEntity.parsecanon

  // Create entity delegate.
  var sd = seneca.delegate()

  // Template entity that makes all others.
  seneca.private$.entity = seneca.private$.entity || MakeEntity({}, sd, opts)

  // Expose the Entity object so third-parties can do interesting things with it
  seneca.private$.exports.Entity =
    seneca.private$.exports.Entity || MakeEntity.Entity

  // all optional
  function api_make() {
    var self = this
    var args = Common.arrayify(arguments)
    args.unshift(self)
    return seneca.private$.entity.make$.apply(seneca.private$.entity, args)
  }

  if (!seneca.make$) {
    seneca.decorate('make$', api_make)
  }

  if (!seneca.make) {
    seneca.decorate('make', api_make)
  }

  // Handle old versions of seneca were the
  // store init was already included by default.
  if (!seneca.store || !seneca.store.init) {
    seneca.decorate('store', Store())
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

  if (opts.client) {
    this.translate('role:entity,cmd:load', 'role:remote-entity')
      .translate('role:entity,cmd:save', 'role:remote-entity')
      .translate('role:entity,cmd:list', 'role:remote-entity')
      .translate('role:entity,cmd:remove', 'role:remote-entity')
  } else if (opts.server) {
    this.translate('role:remote-entity,cmd:load', 'role:entity')
      .translate('role:remote-entity,cmd:save', 'role:entity')
      .translate('role:remote-entity,cmd:list', 'role:entity')
      .translate('role:remote-entity,cmd:remove', 'role:entity')
  }

  return {
    name: 'entity',
    exports: {
      generate_id: opts.generate_id
    }
  }
}
