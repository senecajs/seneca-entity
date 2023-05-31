/* Copyright (c) 2023 Richard Rodger and other contributors, MIT License */

const Seneca = require('seneca')
const Entity = require('../')

describe('transaction', () => {
  test('child-context-only', async () => {
    const si = makeSenecaInstance()

    const tmp = {}

    const txlog = (seneca, str, canonstr) => {
      canonstr = canonstr || '-/-/-'
      let tx = seneca.fixedmeta?.custom?.sys__entity?.transaction
      let handle = tx && tx[canonstr] && tx[canonstr].handle
      handle && handle.log.push(str + ' [' + handle.mark + ']')
    }

    si.add('sys:entity,transaction:transaction', function (msg, reply) {
      tmp.tx = { state: 'start', mark: msg.mark, log: [] }
      reply({ get_handle: () => tmp.tx })
    })

      .add('sys:entity,transaction:commit', function (msg, reply) {
        tmp.tx.state = 'end'
        reply({ done: true, mark: tmp.tx.mark })
      })

      .add('foo:red', async function (msg, reply, meta) {
        txlog(this, 'START foo:1')

        this.entity('red').save$({ x: msg.x }, function (err, out) {
          txlog(this, 'SAVED red ' + out.id)
          reply(out)
        })
      })

    await si.ready()

    let e0 = si.entity()

    // No transaction running.
    let es0a = si.entity.state()
    expect(es0a.canonstr).toEqual('-/-/-')
    expect(es0a.transaction).toBeNull()

    // Begin transaction - returns seneca instance to use.
    let s0 = await si.entity.transaction(null, { mark: 'zero' })
    expect(s0.isSeneca).toBeTruthy()
    expect(
      s0.fixedmeta.custom.sys__entity.transaction['-/-/-'].handle.mark
    ).toEqual('zero')

    // No transaction running in parent!
    let es0b = si.entity.state()
    expect(es0b.canonstr).toEqual('-/-/-')
    expect(es0b.transaction).toBeNull()

    // Get current transaction from entity state.
    let s0t0 = s0.entity.state()
    expect(s0t0.canonstr).toEqual('-/-/-')
    expect(s0t0.transaction.handle.mark).toEqual('zero')
    expect(s0t0.transaction.handle.log).toEqual([])

    // No transaction running in parent!
    let es0c = si.entity.state()
    expect(es0c.transaction).toBeNull()

    // Execute msg in transaction context.
    let red0 = await s0.post('foo:red,x:9')
    expect(red0.x).toEqual(9)

    // No transaction running in parent!
    let es0d = si.entity.state()
    expect(es0d.transaction).toBeNull()

    // Confirm transaction context.
    let s0t1 = s0.entity.state()
    expect(s0t1.canonstr).toEqual('-/-/-')
    expect(s0t1.transaction.handle.mark).toEqual('zero')
    expect(s0t1.transaction.handle.log).toEqual([
      `START foo:1 [zero]`,
      `SAVED red ${red0.id} [zero]`,
    ])

    // No transaction running in parent!
    let es0e = si.entity.state()
    expect(es0e.transaction).toBeNull()

    // End transaction context.
    let tx0 = await s0.entity.commit()
    expect(tx0).toBeDefined()
    expect(tx0.result.done).toEqual(true)

    // No transaction running in parent!
    let es0f = si.entity.state()
    expect(es0f.transaction).toBeNull()

    // No transaction running in child now
    let s0t2 = s0.entity.state()
    expect(s0t2.transaction.finish).toBeTruthy()

    await si.close()

    return

    /*

      .add('foo:2', async function(msg, reply, meta) {
        txlog(this,'START foo:2')
        
        this.entity('green').save$({x:msg.x}, function(err, out) {
          txlog(this,'SAVED green '+out.id)
          reply(out)
        })
      })

      .message('bar:1', async function(msg, reply, meta) {
        txlog(this,'START bar:1')
        
        let foo1 = await this.post('foo:red',{x:msg.x})
        
        txlog(this,'MID bar:1')
        
        let foo2 = await this.post('foo:2',{x:msg.x})
        
        txlog(this,'END bar:1')
        
        return {x:msg.x, foo1, foo2}
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
    

    
    let green0 = await s0.post('foo:2,x:8')    
    // console.log(green)

    let green1 = await s0.post('bar:1,x:7')    
    // console.log(green1)

    let red1 = await s0.post('zed:1,x:6')    
    // console.log(red1)

    let t0b = si.entity.state()
    expect(t0b).toBeDefined()

    let tx = await s0.entity.end()
    expect(tx).toBeDefined()
    // console.log(tx)
    //console.log(tx.handle.log)
    //console.log(tx.handle.log.length)

    let mark = tx.handle.mark
    expect(tx.handle.log).toEqual([
      'START foo:red ['+mark+']',
      'SAVED red '+red0.id+' ['+mark+']',
      'START foo:2 ['+mark+']',
      'SAVED green '+green0.id+' ['+mark+']',
      'START bar:1 ['+mark+']',
      'START foo:red ['+mark+']',
      'SAVED red '+green1.foo1.id+' ['+mark+']',
      'MID bar:1 ['+mark+']',
      'START foo:2 ['+mark+']',
      'SAVED green '+green1.foo2.id+' ['+mark+']',
      'END bar:1 ['+mark+']',
      'START zed:1 C ['+mark+']',
      'START zed:1 B ['+mark+']',
      'START zed:1 A ['+mark+']',
      'START bar:1 ['+mark+']',
      'START foo:red ['+mark+']',
      'SAVED red '+red1.foo1.id+' ['+mark+']',
      'MID bar:1 ['+mark+']',
      'START foo:2 ['+mark+']',
      'SAVED green '+red1.foo2.id+' ['+mark+']',
      'END bar:1 ['+mark+']',
      'END zed:1 A ['+mark+']',
      'END zed:1 B ['+mark+']',
      'END zed:1 C ['+mark+']'
    ])
    let txlen = tx.handle.log.length


    // operations post transaction do not pollute or reuse transaction:
    
    let t0c = si.entity.state()
    expect(t0c).toBeNull()
    
    let out = await si.post('foo:red,x:99')    
    // console.log(out)

    out = await si.post('foo:2,x:88')    
    // console.log(out)

    out = await si.post('bar:1,x:77')    
    // console.log(out)

    out = await si.post('zed:1,x:66')    
    // console.log(out)

    expect(tx.handle.log.length).toEqual(txlen)
    
    
    let t0d = s0.entity.state()
    expect(t0d).toBeNull()

    out = await s0.post('foo:red,x:999')    
    // console.log(out)

    out = await s0.post('foo:2,x:888')    
    // console.log(out)

    out = await s0.post('bar:1,x:777')    
    // console.log(out)

    out = await s0.post('zed:1,x:666')    
    // console.log(out)

    expect(tx.handle.log.length).toEqual(txlen)



    let t0e = si.entity.state()
    expect(t0e).toBeNull()

    
    let s1 = await s0.entity.transaction()

    let t1a= si.entity.state()
    expect(t1a).toBeDefined()
    */

    /*
    
    out = await s1.post('foo:red,x:9')    

    let t1b= si.entity.state()
    expect(t1b).toBeDefined()

    tx = await s1.entity.transaction()
    let t1c= si.entity.state()
    console.log('t1c', t1c)


    // console.log(tx)
    console.log(tx.handle.log)
    console.log(tx.handle.log.length)    

    */
  })

  
  test('prior-only-no-ent-ops', async () => {
    const si = makeSenecaInstance()
    const transaction = {}

    si
      .add('sys:entity,transaction:transaction', function (msg, reply) {
        transaction.tx = { state: 'start', mark: msg.mark, log: [] }
        reply({ get_handle: () => transaction.tx })
      })

      .add('sys:entity,transaction:commit', function (msg, reply) {
        transaction.tx.state = 'end'
        reply({ done: true, mark: transaction.tx.mark })
      })

      .add('b:1', function b1A(msg, reply) {
        reply({A:1,B:msg.B,y:msg.y+'A'})
      })
      .add('b:1', function b1B(msg, reply) {
        this.prior({B:1,y:msg.y+'B'}, reply)
      })
      .message('a:1', async function a1(msg) {
        let tx = await this.entity.transaction()
        // console.log('TX', tx.did)
        let out = await tx.post({b:1,y:'S'})
        await tx.entity.commit()
        return out
      })
      .add('c:1', function a1(msg, reply) {
        this.entity.transaction()
          .then(function(tx) {
            // console.log('TX', tx.did)
            tx.act({b:1,y:'S'}, function(err, out) {
              this.entity.commit()
                .then(function(){
                  reply(out)
                })
                .catch(reply)
            })
          })
          .catch(reply)
      })

    
    await si.ready()

    let out = await si.post('a:1')
    // console.log('QQQ', out)
    expect(out).toEqual({ A: 1, B: 1, y: 'SBA' })

    out = await si.post('c:1')
    // console.log('QQQ', out)
    expect(out).toEqual({ A: 1, B: 1, y: 'SBA' })

  })



  test('start-with-immediate-commit', async () => {
    const si = makeSenecaInstance()
    const transaction = {}

    si.add('sys:entity,transaction:transaction', function (msg, reply) {
      transaction.tx = { state: 'start', mark: msg.mark, log: [] }
      reply({ get_handle: () => transaction.tx })
    })

      .add('sys:entity,transaction:commit', function (msg, reply) {
        transaction.tx.state = 'end'
        reply({ done: true, mark: transaction.tx.mark })
      })

      .add('hello:world', function (msg, reply) {
        this.entity
          .transaction()
          .then((senecatrx) => {
            return senecatrx.entity.commit()
          })
          .then(() => reply())
          .catch(reply)
      })

    await si.ready()
    await si.post('hello:world')
  })

})

function jj(x) {
  return JSON.parse(JSON.stringify(x))
}

function makeSenecaInstance() {
  const seneca = Seneca({
    legacy: false,
    // default_plugins: {
    //   entity: false,
    //   'mem-store': false,
    // },
    // plugins: [Entity],
  })

  seneca
    .test()
    .use('promisify')
    .use(Entity, {
      transaction: {
        active: true,
      },
    })

  return seneca
}
