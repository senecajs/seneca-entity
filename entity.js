'use strict'

var Common = require('./lib/common')
var MakeEntity = require('./lib/make_entity')
var Store = require('./lib/store')


module.exports = function (options) {
  return {
    name: 'entity'
  }
}


// All functionality should be loaded when defining plugin
module.exports.preload = function () {
  var seneca = this

  seneca.util.parsecanon = seneca.util.parsecanon || MakeEntity.parsecanon

  // Create entity delegate.
  var sd = seneca.delegate()
  sd.log = function () {
    var args = ['entity']
    seneca.log.apply(this, args.concat(Common.arrayify(arguments)))
  }
  sd.makelogfuncs()

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
  if (!seneca.store && !seneca.store.init) {
    seneca.decorate('store', Store())
  }

  return {
    name: 'entity'
  }
}
