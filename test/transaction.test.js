/* Copyright (c) 2023 Richard Rodger and other contributors, MIT License */

const Seneca = require('seneca')
const Entity = require('../')


describe('transaction', () => {
  test('basic', async () => {
    const si = makeSenecaInstance()

    const tmp = {}
    
    const txlog = (seneca, str) => {
      let handle = seneca.fixedmeta?.custom?.sys__entity?.transaction?.handle
      handle && handle.log.push(str+' ['+handle.mark+']')
    }

    si
      .add('sys:entity,transaction:begin', function (msg, reply) {
        tmp.tx = { handle: { state: 'start', mark: this.util.Nid(), log: [] } }
        reply(tmp.tx)
      })
    
      .add('sys:entity,transaction:end', function (msg, reply) {
        tmp.tx.handle.state = 'end'
        reply(tmp.tx)
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
        
        let foo1 = await this.post('foo:1',{x:msg.x})
        
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
    

    await si.ready()


    let tn = si.entity.active()
    expect(tn).toBeNull()
    
    let s0 = await si.entity.begin() // 'sys/foo')
    let t0a = si.entity.active()
    // console.log('t0a', t0a)
    // console.log(s0.fixedmeta.custom.sys__entity)
    // console.log('TXI', s0)
    // console.log('BBB', s0.entity())// .private$.get_instance())

    expect(t0a).toMatchObject({
      begin: { handle: { state: 'start', log: [] } },
      canon: {},
      handle: { state: 'start', log: [] },
      trace: [],
      sid: si.id,
    })
    
    let red0 = await s0.post('foo:1,x:9')    
    // console.log(red)

    let green0 = await s0.post('foo:2,x:8')    
    // console.log(green)

    let green1 = await s0.post('bar:1,x:7')    
    // console.log(green1)

    let red1 = await s0.post('zed:1,x:6')    
    // console.log(red1)

    let t0b = si.entity.active()
    expect(t0b).toBeDefined()

    let tx = await s0.entity.end()
    expect(tx).toBeDefined()
    // console.log(tx)
    //console.log(tx.handle.log)
    //console.log(tx.handle.log.length)

    let mark = tx.handle.mark
    expect(tx.handle.log).toEqual([
      'START foo:1 ['+mark+']',
      'SAVED red '+red0.id+' ['+mark+']',
      'START foo:2 ['+mark+']',
      'SAVED green '+green0.id+' ['+mark+']',
      'START bar:1 ['+mark+']',
      'START foo:1 ['+mark+']',
      'SAVED red '+green1.foo1.id+' ['+mark+']',
      'MID bar:1 ['+mark+']',
      'START foo:2 ['+mark+']',
      'SAVED green '+green1.foo2.id+' ['+mark+']',
      'END bar:1 ['+mark+']',
      'START zed:1 C ['+mark+']',
      'START zed:1 B ['+mark+']',
      'START zed:1 A ['+mark+']',
      'START bar:1 ['+mark+']',
      'START foo:1 ['+mark+']',
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
    
    let t0c = si.entity.active()
    expect(t0c).toBeNull()
    
    let out = await si.post('foo:1,x:99')    
    // console.log(out)

    out = await si.post('foo:2,x:88')    
    // console.log(out)

    out = await si.post('bar:1,x:77')    
    // console.log(out)

    out = await si.post('zed:1,x:66')    
    // console.log(out)

    expect(tx.handle.log.length).toEqual(txlen)
    
    
    let t0d = s0.entity.active()
    expect(t0d).toBeNull()

    out = await s0.post('foo:1,x:999')    
    // console.log(out)

    out = await s0.post('foo:2,x:888')    
    // console.log(out)

    out = await s0.post('bar:1,x:777')    
    // console.log(out)

    out = await s0.post('zed:1,x:666')    
    // console.log(out)

    expect(tx.handle.log.length).toEqual(txlen)



    let t0e = si.entity.active()
    expect(t0e).toBeNull()

    
    let s1 = await s0.entity.begin()

    let t1a= si.entity.active()
    expect(t1a).toBeDefined()


    /*
    
    out = await s1.post('foo:1,x:9')    

    let t1b= si.entity.active()
    expect(t1b).toBeDefined()

    tx = await s1.entity.end()
    let t1c= si.entity.active()
    console.log('t1c', t1c)


    // console.log(tx)
    console.log(tx.handle.log)
    console.log(tx.handle.log.length)    

    */
    
    await si.close()
  })
})


function jj(x) {
  return JSON.parse(JSON.stringify(x))
}


function makeSenecaInstance() {
  const seneca = Seneca(
    {
      legacy: false,
      default_plugins: {
        entity: false,
        'mem-store': false,
      },
      plugins: [Entity],
    }
  )

  seneca
    .test()
    .use('promisify')

  return seneca
}
