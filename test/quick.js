const Seneca = require('seneca')
const Entity = require('..')

const dur = 5000

const txlog = (seneca, str) => {
  let handle = seneca.fixedmeta?.custom?.sys__entity?.transaction?.handle
  handle && handle.log.push(str+' ['+handle.mark+']')
}


let seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
  .use(Entity)

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
