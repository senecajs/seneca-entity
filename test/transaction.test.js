/* Copyright (c) 2023 Richard Rodger and other contributors, MIT License */

const Seneca = require('seneca')
const Entity = require('../')

function describe(description, suite) {
  suite()
}

function test(description, f) { // mock
  function onTestError(err) {
    return console.error(description, err)
  }

  function onTestDone() {
    return console.log(description, 'OK')
  }

  const p = f((err) => {
    if (err) onTestError(err)
    else onTestDone()
  })

  if (p && p.then) {
    p.then(onTestDone)
  }

  if (p && p.catch) {
    p.catch(onTestError)
  }
}

function expect(_subject) { // mock
  return new Proxy({}, {
    get(self, prop, receiver) {
      return function () {}
    }
  })
}

describe('transaction', () => {
  /*
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
    let es0a = si.entity().state()
    expect(es0a.canonstr).toEqual('-/-/-')
    expect(es0a.transaction).toBeNull()

    // Begin transaction - returns seneca instance to use.
    let s0 = await si.entity().transaction(null, { mark: 'zero' })
    expect(s0.isSeneca).toBeTruthy()
    expect(
      s0.fixedmeta.custom.sys__entity.transaction['-/-/-'].handle.mark
    ).toEqual('zero')

    // No transaction running in parent!
    let es0b = si.entity().state()
    expect(es0b.canonstr).toEqual('-/-/-')
    expect(es0b.transaction).toBeNull()

    // Get current transaction from entity state.
    let s0t0 = s0.entity().state()
    expect(s0t0.canonstr).toEqual('-/-/-')
    expect(s0t0.transaction.handle.mark).toEqual('zero')
    expect(s0t0.transaction.handle.log).toEqual([])

    // No transaction running in parent!
    let es0c = si.entity().state()
    expect(es0c.transaction).toBeNull()

    // Execute msg in transaction context.
    let red0 = await s0.post('foo:red,x:9')
    expect(red0.x).toEqual(9)

    // No transaction running in parent!
    let es0d = si.entity().state()
    expect(es0d.transaction).toBeNull()

    // Confirm transaction context.
    let s0t1 = s0.entity().state()
    expect(s0t1.canonstr).toEqual('-/-/-')
    expect(s0t1.transaction.handle.mark).toEqual('zero')
    expect(s0t1.transaction.handle.log).toEqual([
      `START foo:1 [zero]`,
      `SAVED red ${red0.id} [zero]`,
    ])

    // No transaction running in parent!
    let es0e = si.entity().state()
    expect(es0e.transaction).toBeNull()

    // End transaction context.
    let tx0 = await s0.entity().commit()
    expect(tx0).toBeDefined()
    expect(tx0.result.done).toEqual(true)

    // No transaction running in parent!
    let es0f = si.entity().state()
    expect(es0f.transaction).toBeNull()

    // No transaction running in child now
    let s0t2 = s0.entity().state()
    expect(s0t2.transaction.finish).toBeTruthy()

    await si.close()

    return
  })
  */

  test('simple transaction() - commit() routine', (fin_) => {
    const onDone = calledOnce(fin_)

    const si = makeSenecaInstance()
    si.test(onDone)


    const trx_handle = { tx: { state: 'start', mark: 'whatever', log: [] } }

    si.add('sys:entity,transaction:transaction', function (msg, reply) {
      reply({ get_handle: () => trx_handle })
    })

    si.add('sys:entity,transaction:commit', function (msg, reply) {
      trx_handle.tx.state = 'end'
      reply({ done: true, mark: trx_handle.tx.mark })
    })


    si.add('hello:world', function (args, reply) {
      this.entity().transaction()
      	.then((trx) => {
	  debugger // dbg
	  return trx.entity().commit()
	})
	.then(() => reply())
	.catch(reply)
    })

    si.act('hello:world', onDone)
  })

  /*
  test('does not crash when used with priors', (fin_) => {
    const onDone = calledOnce(fin_)

    const si = makeSenecaInstance()
    si.test(onDone)


    const trx_handle = { tx: { state: 'start', mark: 'whatever', log: [] } }

    si.add('sys:entity,transaction:transaction', function (msg, reply) {
      reply({ get_handle: () => trx_handle })
    })

    si.add('sys:entity,transaction:commit', function (msg, reply) {
      trx_handle.tx.state = 'end'
      reply({ done: true, mark: trx_handle.tx.mark })
    })


    si.add('hello:world', function (args, reply) {
      reply()
    })

    si.add('hello:world', function (args, reply) {
      this.entity().transaction()
      	.then((trx) => {
	  trx.prior(args, function (err) {
	    if (err) {
	      return onDone(err)
	    }

	    trx.entity().commit()
	      .then(() => onDone())
	      .catch(onDone)
	  })
	})
	.catch(reply)
    })

    si.act('hello:world', onDone)

    setTimeout(() => {
      onDone(new Error('timed out'))
    }, 5e3)
  })
  */
})

function calledOnce(f) {
  let was_called = false

  return (...args) => {
    if (was_called) return
    was_called = true

    f(...args)
  }
}

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
