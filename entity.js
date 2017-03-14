/* Copyright (c) 2010-2017 Richard Rodger and other contributors, MIT License */
'use strict'

var Common = require('./lib/common')
var MakeEntity = require('./lib/make_entity')
var Store = require('./lib/store')

var opts = {
  mem_store: true,
  generate_id: Common.generate_id
}

module.exports = function entity (options) {
  return {
    name: 'entity'
  }
}

// All functionality should be loaded when defining plugin
module.exports.preload = function entity (context) {
  var seneca = this

  opts = seneca.util.deepextend(opts, context.options)

  // Removes dependency on seneca-basic
  // TODO: deprecate this
  seneca.add('role:basic,cmd:generate_id', Common.generate_id)


  seneca.util.parsecanon = seneca.util.parsecanon || MakeEntity.parsecanon

  // Create entity delegate.
  var sd = seneca.delegate()

  // Template entity that makes all others.
  seneca.private$.entity = seneca.private$.entity || MakeEntity({}, sd)

  // Expose the Entity object so third-parties can do interesting things with it
  seneca.private$.exports.Entity = seneca.private$.exports.Entity || MakeEntity.Entity

  // all optional
  function api_make () {
    var self = this
    var args = Common.arrayify(arguments)
    args.unshift(self)
    return seneca.private$.entity.make$.apply(seneca.private$.entity, args)
  }

  seneca.decorate('make$', api_make)
  seneca.decorate('make', api_make)

  // Handle old versions of seneca were the
  // store init was already included by default.
  if (!seneca.store || !seneca.store.init) {
    seneca.decorate('store', Store())
  }

  // Ensures legacy versions of seneca that load mem-store do not
  // crash the system. Seneca 2.x and lower loads mem-store by default.
  if (!seneca.options().default_plugins['mem-store'] & opts.mem_store) {
    seneca.root.use(require('seneca-mem-store'))
  }

  return {
    name: 'entity',
    exports: {
      generate_id: opts.generate_id
    }
  }
}
