const Seneca = require('seneca')
const Entity = require('../')

// console.log(Seneca.util.Gex('a*'))

let s0 = Seneca({
  legacy: false,
  error: {
    capture: {
      callback: false,
      action: false,
    },
  },
})
  .test()
    .use(Entity, {transaction:{active:true}})

  .act('sys:entity,hook:intercept,intercept:act_error', {
    action: function foo_interceptor(actcall) {
      console.log('FOO_INTERCEPTOR', actcall.actdef)
    }
  }, Seneca.util.print)
  .add('a:1', function a1(msg, reply) {
    reply({ x: msg.x })
  })
  .add('b:1', function a1(msg, reply) {
    throw new Error('CC')
  })
  .add('role:entity,cmd:list,name:foo', function () {
    throw new Error('DD')
  })
  .listen()
  .ready(function () {
    console.log(this.util.Gex('*'))

    // this.act('b:1,x:2', function(err, out) {
    //   console.log(out)
    // })

    // this.act('a:1,x:2', function(err, out) {
    //   throw new Error('AA')
    // })

    // this.entity('foo').save$(function(err, out) {
    //   throw new Error('BB')
    // })

    this.entity('foo').list$(Seneca.util.print)
  })
