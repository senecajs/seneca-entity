const Seneca = require('seneca')
const Entity = require('..')

const dur = 5000

const txlog = (seneca, str) => {
  let handle = seneca.fixedmeta?.custom?.sys__entity?.transaction?.handle
  handle && handle.log.push(str + ' [' + handle.mark + ']')
}

const tmp = {}

let seneca = Seneca({ legacy: false }).test().use('promisify').use(Entity)

seneca
  .add('sys:entity,transaction:begin', function (msg, reply) {
    tmp.tx = { handle: { state: 'start', mark: this.util.Nid(), log: [] } }
    reply(tmp.tx)
  })

  .add('sys:entity,transaction:end', function (msg, reply) {
    tmp.tx.handle.state = 'end'
    reply(tmp.tx)
  })

seneca.ready(async function () {
  let s0 = this
  console.log('s0 A', s0)

  let entapi0 = s0.entity()

  let s1 = s0.delegate()
  console.log('s1 A', s1)

  let entapi1 = s1.entity()
  let entapi0a = s0.entity()

  let foo0 = s0.entity('foo')
  console.log('foo0', foo0.private$.get_instance())

  console.log('AAA')
  let entapi0a_foo0 = s0.entity()
  console.log('BBB')
  let entapi1_foo0 = s1.entity()
  console.log('CCC')

  let foo00 = s0.entity('foo')
  console.log('foo00', foo00.private$.get_instance())

  let foo1 = s1.entity('foo')
  console.log('foo1', foo1.private$.get_instance())

  console.log('ins0.entity', s0.entity.toString())
  console.log('ins0.entity()', s0.entity())
  console.log('ins0', s0.entity.instance())

  console.log('ins1.entity', s1.entity.toString())
  console.log('ins1.entity()', s1.entity())
  console.log('ins1', s1.entity.instance())

  /*
  let st1 = await this.entity.begin()
  console.log('st1 begin', st1)
  console.log('s0 B', s0)
  
  let st1txa = st1.entity.active()
  console.log('st1txa active', st1txa)

  let s0txa = s0.entity.active()
  console.log('s0txa active', s0txa)
  */
})

/*
  .add('sys:entity,transaction:begin', function (msg, reply) {
    reply({ handle: { tx: 'start', mark: this.util.Nid(), log: [] } })
  })

  .add('sys:entity,transaction:end', function (msg, reply) {
    reply({ handle: { tx: 'end' } })
  })

    .add('foo:1', async function(msg, reply, meta) {
      txlog(this,'START foo:1')
      
      this.entity('red').save$({x:msg.x}, function(err, out) {
        txlog(this,'SAVED red '+out.id)
        reply(out)
      })
    })


    .add('foo:2', async function(msg, reply, meta) {
      txlog(this,'START foo:2')

      this.entity('green').save$({x:msg.x}, function(err, out) {
        txlog(this,'SAVED green '+out.id)
        reply(out)
      })
    })

    .message('bar:1', async function(msg, reply, meta) {
      txlog(this,'START bar:1')

      await this.post('foo:1',{x:msg.x})

      txlog(this,'MID bar:1')
      
      await this.post('foo:2',{x:msg.x})

      txlog(this,'END bar:1')

      return {x:msg.x}
    })


    .message('zed:1', async function(msg, reply, meta) {
      txlog(this,'START zed:1 A')

      let out = await this.post('bar:1',{x:msg.x})

      txlog(this,'END zed:1 A')

      return out
    })


    .message('zed:1', async function(msg, reply, meta) {
      txlog(this,'START zed:1 B')

      let out = await this.prior(msg)

      txlog(this,'END zed:1 B')

      return out
    })


    .message('zed:1', async function(msg, reply, meta) {
      txlog(this,'START zed:1 C')

      let out = await this.prior(msg)

      txlog(this,'END zed:1 C')

      return out
    })


    .ready(async function () {
      const seneca = this

      let tn = seneca.entity.active()
      console.log('tn', null)
      
      let s0 = await seneca.entity.begin() // 'sys/foo')
      let t0a = seneca.entity.active()
      console.log('t0a', t0a)
      
      // console.log(s0.fixedmeta.custom.sys__entity)
      // console.log('TXI', s0)
      
      // console.log('BBB', s0.entity())// .private$.get_instance())
      
      let out = await s0.post('foo:1,x:9')    
      console.log(out)

      out = await s0.post('foo:2,x:8')    
      console.log(out)

      out = await s0.post('bar:1,x:7')    
      console.log(out)

      out = await s0.post('zed:1,x:6')    
      console.log(out)

      let t0b = seneca.entity.active()
      console.log('t0b', t0b)
      let tx = await s0.entity.end()
      // console.log(tx)
      console.log(tx.handle.log)
      console.log(tx.handle.log.length)

      let t0c = seneca.entity.active()
      console.log('t0c', t0c)

      
      out = await seneca.post('foo:1,x:99')    
      console.log(out)

      out = await seneca.post('foo:2,x:88')    
      console.log(out)

      out = await seneca.post('bar:1,x:77')    
      console.log(out)

      out = await seneca.post('zed:1,x:66')    
      console.log(out)

      // console.log(tx.handle.log)
      console.log(tx.handle.log.length)


      out = await s0.post('foo:1,x:999')    
      console.log(out)

      out = await s0.post('foo:2,x:888')    
      console.log(out)

      out = await s0.post('bar:1,x:777')    
      console.log(out)

      out = await s0.post('zed:1,x:666')    
      console.log(out)

      // console.log(tx.handle.log)
      console.log(tx.handle.log.length)


      let t0d = seneca.entity.active()
      console.log('t0d', t0d)
      
      let s1 = await s0.entity.begin() // 'sys/foo')

      let t1a= seneca.entity.active()
      console.log('t1a', t1a)
      
      out = await s1.post('foo:1,x:9')    
      console.log(out)

      let t1b= seneca.entity.active()
      console.log('t1b', t1b)

      tx = await s1.entity.end()
      let t1c= seneca.entity.active()
      console.log('t1c', t1c)


      // console.log(tx)
      console.log(tx.handle.log)
      console.log(tx.handle.log.length)

*/

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
//  })
