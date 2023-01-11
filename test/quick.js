const Seneca = require('seneca')
const Entity = require('..')

const dur = 5000

let seneca = Seneca({ legacy: false })
  .test()
    .use(Entity)

    .add('sys:entity,transaction:begin', function(msg, reply) {
      reply({handle:{tx:'start'}})
    })

    .add('sys:entity,transaction:end', function(msg, reply) {
      reply({handle:{tx:'end'}})
    })


  .ready(async function () {
    let s0 = await seneca.entity.begin('sys/foo')
    // console.log(s0.fixedmeta.custom.sys__entity)
    console.log('TXI', s0)

    // console.log('BBB', s0.entity())// .private$.get_instance())

    let tx = await s0.entity.end()
    console.log(tx)

    /*
    let foo0 = seneca.make$('foo').data$({ x: 1 })
    let foo11 = seneca.make$('foo').data$({ x: 11 })

    console.log('foo0', foo0)
    console.log('foo0.__promisify$$', foo0.__promisify$$)
    console.log('foo0.private$', foo0.private$)
    console.log('foo0=' + foo0)

    foo0.save$(function (err, foo1) {
      console.log('' + foo1, foo1)

      let foo12 = seneca.make$('foo').data$({ x: 12 })

      console.log('+++')
      console.log(foo1.hasOwnProperty('custom$'))
      console.log(foo1.__proto__.hasOwnProperty('custom$'))
      console.log(foo1.__proto__.__proto__.hasOwnProperty('custom$'))
      console.log(foo1.__proto__.__proto__.__proto__.hasOwnProperty('custom$'))
      console.log('===')
      console.log(foo1.custom$)
      console.log(foo1.__proto__.custom$)
      console.log(foo1.__proto__.__proto__.custom$)
      console.log(foo1.__proto__.__proto__.__proto__.custom$)
      foo1.custom$({ a: 2 })
      console.log(foo1.custom$)
      console.log(foo1.__proto__.custom$)
      console.log(foo1.__proto__.__proto__.custom$)
      console.log(foo1.__proto__.__proto__.__proto__.custom$)
      console.log('===')

      let foo2 = seneca.make$('foo').data$({ x: 2 })
      foo2.custom$({ b: 3 })

      console.log('' + foo1, foo1, foo1.custom$)
      console.log('' + foo2, foo2, foo2.custom$)
      console.log(foo0.custom$, foo11.custom$, foo12.custom$)
    })
    */

    /*
    let foo = this.make('foo').data$({ x: 1 })
    console.log('S-A', foo, foo.async$)

    let fooSave = foo.save$((err, fooS) => {
      console.log('S-B', err, fooS)
    })
    console.log(fooSave, fooSave.entity$)

    setImmediate(async () => {
      let bar = this.entity('bar').data$({ y: 1 })
      console.log('A-A', bar, bar.async$)

      let barS = await bar.save$({ meta$: true })
      console.log(
        'A-B',
        barS,
        barS.async$,
        barS.meta$.pattern,
        barS.meta$.action
      )
      })
      */
  })
