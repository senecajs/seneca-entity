/* Copyright (c) 2010-2022 Richard Rodger and other contributors, MIT License */

const Util = require('util')

const Seneca = require('seneca')
const Entity = require('../')
const Store = require('../dist/lib/store')
const { generate_id } = require('../dist/lib/common')

const StoreIntern = Store.Intern

// TODO: update when Seneca.util.Gex is available
const GexModule = require('Gex') || require('Gex').default
const Gex = Seneca.util.Gex || GexModule.Gex

function SenecaInstance() {
  const seneca = Seneca({
    default_plugins: {
      entity: false,
      'mem-store': false,
    },
    plugins: [Entity],
  }).test()

  return seneca
}

describe('entity', function () {
  test('happy-mem', function (fin) {
    const si = SenecaInstance()
    si.test(fin)

    const fooent = si.make$('foo')
    expect(fooent.is$('foo')).toBeTruthy()
    expect(!fooent.is$('bar')).toBeTruthy()

    fooent.data$({ a: 1, b: 2 }).save$(function (err, out) {
      expect(err).toEqual(null)
      expect(out.id).toBeTruthy()
      expect(1).toEqual(out.a)
      expect(2).toEqual(out.b)

      si.close(fin)
    })
  })

  test('happy-mem-promise', async function () {
    const si = Seneca({ legacy: false })
          .use('promisify')
          .use('..').test()

    const fooent = si.entity('foo')

    expect(fooent.is$('foo')).toBeTruthy()
    expect(!fooent.is$('bar')).toBeTruthy()

    const out = await fooent.data$({ a: 1, b: 2 }).save$()

    expect(out.id).toBeTruthy()
    expect(1).toEqual(out.a)
    expect(2).toEqual(out.b)

    await si.close()
  })

  test('happy-mem-zone-base-name', function (fin) {
    const si = SenecaInstance()
    si.test(fin)

    const z0b0n0ent = si.make$('z0/b0/n0')
    expect(z0b0n0ent.is$('z0/b0/n0')).toBeTruthy()
    expect(!z0b0n0ent.is$('z0/b0/n1')).toBeTruthy()

    z0b0n0ent.data$({ a: 1, b: 2 }).save$(function (err, out) {
      expect(err).toEqual(null)
      expect(out.id).toBeTruthy()
      expect(1).toEqual(out.a)
      expect(2).toEqual(out.b)

      si.close(fin)
    })
  })

  test('entity-promise', async () => {
    const si = Seneca({ legacy: false }).use('promisify').use('..').test()

    const bar0 = si.entity('bar').data$({ a: 1 })
    expect('' + bar0).toEqual('$-/-/bar;id=;{a:1}')

    const bar1 = si.entity('bar', { a: 2 })
    expect('' + bar1).toEqual('$-/-/bar;id=;{a:2}')

    const bar2 = si.entity('bar')
    bar2.a = 3
    expect('' + bar2).toEqual('$-/-/bar;id=;{a:3}')

    const bar10 = si.make('bar').data$({ a: 1 })
    expect('' + bar10).toEqual('$-/-/bar;id=;{a:1}')

    const bar11 = si.make('bar', { a: 2 })
    expect('' + bar11).toEqual('$-/-/bar;id=;{a:2}')

    const bar12 = si.make('bar')
    bar12.a = 3
    expect('' + bar12).toEqual('$-/-/bar;id=;{a:3}')

    const foo0 = await si.entity('foo').data$({ a: 1 }).save$()

    const foo1 = await si.entity('foo').load$(foo0.id)
    expect('' + foo0).toEqual('' + foo1)

    const foo2 = await si.entity('foo').data$({ a: 1 }).save$()
    let list = await si.entity('foo').list$({ a: 1 })
    expect(list.length).toEqual(2)

    await foo0.remove$()
    list = await si.entity('foo').list$({ a: 1 })
    expect(list.length).toEqual(1)

    const foo3 = list[0].clone$()
    foo3.a = 2
    await foo3.save$()

    const foo4 = await list[0].load$()
    expect(foo4.a).toEqual(2)

    const zed0 = await si.entity('core/zed').data$({ z: 0 }).save$()
    const zed1 = await si.entity('core/zed').data$({ z: 1 }).save$()
    let zeds = await si.entity('core/zed').list$()
    expect(zeds.length).toEqual(2)

    await si.entity('core/zed').remove$({ z: 1 })
    zeds = await si.entity('core/zed').list$()
    expect(zeds.length).toEqual(1)
  })

  test('tag-load', function (fin) {
    const s0 = Seneca()
      .test(fin)
      .use('../')
      .use('../')
      .use('../$a')
      .use('../$b')
    fin()
  })

  test('plain-messages', function (fin) {
    const s0 = Seneca().test(fin).use(Entity)

    s0.gate()
      .act(
        'role:entity,cmd:save,base:b0,name:n0',
        { ent: { id$: 'e0', f0: 1 } },
        function (err, out) {
          expect(out.data$()).toEqual({
            entity$: { zone: undefined, base: 'b0', name: 'n0' },
            id: 'e0',
            f0: 1,
          })
        }
      )
      .act(
        'role:entity,cmd:load,base:b0,name:n0',
        { id: 'e0' },
        function (err, out) {
          expect(out.data$()).toEqual({
            entity$: { zone: undefined, base: 'b0', name: 'n0' },
            id: 'e0',
            f0: 1,
          })
        }
      )
      .act(
        'role:entity,cmd:load,base:b0,name:n0',
        { q: { id: 'e0' } },
        function (err, out) {
          expect(out.data$()).toEqual({
            entity$: { zone: undefined, base: 'b0', name: 'n0' },
            id: 'e0',
            f0: 1,
          })
        }
      )
      .act(
        'role:entity,cmd:list,base:b0,name:n0',
        { id: 'e0' },
        function (err, out) {
          expect(out[0].data$()).toEqual({
            entity$: { zone: undefined, base: 'b0', name: 'n0' },
            id: 'e0',
            f0: 1,
          })
        }
      )

      // q wins over id
      .act(
        'role:entity,cmd:list,base:b0,name:n0',
        { q: { id: 'e0' }, id: 'e0x' },
        function (err, out) {
          expect(out[0].data$()).toEqual({
            entity$: { zone: undefined, base: 'b0', name: 'n0' },
            id: 'e0',
            f0: 1,
          })
        }
      )
      .act('role:entity,cmd:remove,base:b0,name:n0', { id: 'e0' })
      .act(
        'role:entity,cmd:load,base:b0,name:n0',
        { id: 'e0' },
        function (err, out) {
          expect(null == out).toBeTruthy()
        }
      )
      .act(
        'role:entity,cmd:list,base:b0,name:n0',
        { q: { id: 'e0' } },
        function (err, out) {
          expect(out.length).toEqual(0)
        }
      )

      .ready(fin)
  })

  test('reify_entity_wrap_without_ent', function (fin) {
    const si = SenecaInstance()
    const w0 = StoreIntern.reify_entity_wrap(function (msg, reply) {
      expect(msg.q).toEqual({})
      expect(msg.qent.entity$).toEqual('z0/b0/n0')
      reply()
    })

    w0.call(si, { role: 'entity', zone: 'z0', base: 'b0', name: 'n0' }, fin)
  })

  test('reify_entity_wrap_with_ent', function (fin) {
    const si = SenecaInstance()
    const w0 = StoreIntern.reify_entity_wrap(function (msg, reply) {
      expect(msg.q).toBeUndefined()
      expect(msg.qent).toBeUndefined()
      expect(msg.ent.entity$).toEqual('z0/b0/n0')
      reply()
    })

    w0.call(
      si,
      {
        role: 'entity',
        zone: 'z0',
        base: 'b0',
        name: 'n0',
        cmd: 'save',
        ent: { f0: 1 },
      },
      fin
    )
  })

  test('cmd_wrap_list', function (fin) {
    const si = SenecaInstance()
    const w0 = StoreIntern.cmd_wrap.list(function (msg, reply) {
      expect(msg.sort).toEqual({ foo: -1 })
      reply()
    })

    w0.call(si, { role: 'entity', cmd: 'list', name: 'n0', sort: '-foo' }, fin)
  })

  test('common', function (fin) {
    expect(generate_id(3).length).toEqual(3)
    expect(generate_id({ length: 1 }).length).toEqual(1)
    expect(generate_id(66).length).toEqual(66)

    // default length
    expect(generate_id().length).toEqual(6)
    expect(generate_id(0).length).toEqual(6)

    generate_id(null, function (n) {
      expect(n.length).toEqual(6)
      fin()
    })
  })

  test('setid-mem', function (fin) {
    const si = SenecaInstance()
    const z0 = si.make('zed')
    z0.id$ = 0
    z0.z = 0
    z0.save$(function (e, z) {
      expect(0).toEqual(z.id)
      expect(0).toEqual(z.z)

      si.make('zed', { id$: 1, z: 1 }).save$(function (e, z) {
        expect(1).toEqual(z.id)
        expect(1).toEqual(z.z)

        si.make('zed')
          .data$({ id$: 2, z: 2 })
          .save$(function (e, z) {
            expect(2).toEqual(z.id)
            expect(2).toEqual(z.z)

            si.close(fin)
          })
      })
    })
  })

  // TODO: promisify in Seneca 4
  test('mem-ops', require('./mem-ops.js')(SenecaInstance()))

  test('parsecanon', function (fin) {
    const si = SenecaInstance()

    function def(v, d) {
      return v == null ? d : v
    }
    function fmt(cn) {
      return (
        def(cn.zone, '-') + '/' + def(cn.base, '-') + '/' + def(cn.name, '-')
      )
    }

    expect('-/-/n1').toEqual(fmt(si.util.parsecanon('n1')))
    expect('-/b1/n1').toEqual(fmt(si.util.parsecanon('b1/n1')))
    expect('z1/b1/n1').toEqual(fmt(si.util.parsecanon('z1/b1/n1')))

    expect('-/-/-').toEqual(fmt(si.util.parsecanon('-')))
    expect('-/-/-').toEqual(fmt(si.util.parsecanon('-/-')))
    expect('-/-/-').toEqual(fmt(si.util.parsecanon('-/-/-')))
    expect('-/-/0').toEqual(fmt(si.util.parsecanon('0')))
    expect('-/0/0').toEqual(fmt(si.util.parsecanon('0/0')))
    expect('0/0/0').toEqual(fmt(si.util.parsecanon('0/0/0')))

    let fail
    try {
      si.util.parsecanon('')
      fail = ''
    } catch (e) {
      expect('invalid_canon').toEqual(e.code)
    }

    try {
      si.util.parsecanon('?')
      fail = '?'
    } catch (e) {
      expect('invalid_canon').toEqual(e.code)
    }

    expect(fail).toEqual(void 0)

    const foo = si.make$('foo')
    expect('a/b/c').toEqual(fmt(foo.canon$({ parse: 'a/b/c' })))
    si.close(fin)
  })

  // TODO: a bit more please!
  test('load', function (fin) {
    const si = SenecaInstance()
    const foo = si.make$('foo')
    foo.load$(null, function () {
      expect(this.seneca).toBeDefined()
      fin()
    })
  })

  // TODO: a bit more please!
  test('remove', function (fin) {
    const si = SenecaInstance()
    const foo = si.make$('foo')
    foo.remove$(null, function () {
      expect(this.seneca).toBeDefined()
      fin()
    })
  })

  test('fields-directive', function (fin) {
    const si = SenecaInstance()
    si.test(fin)
    si.make$('fdent', { a: 1, b: 2 }).save$(function (err, out0) {
      out0.load$({ id: out0.id, fields$: ['a'] }, function (err, out1) {
        expect(out1.a).toEqual(1)
        expect(out1.b).toEqual(undefined)

        out0.list$({ id: out0.id, fields$: ['b'] }, function (err, list) {
          expect(list[0].b).toEqual(2)
          expect(list[0].a).toEqual(undefined)

          fin()
        })
      })
    })
  })

  test('make', function (fin) {
    const si = SenecaInstance()
    const foo = si.make$('foo')
    expect('-/-/foo').toEqual(foo.entity$)
    expect('-/-/foo').toEqual(foo.canon$())
    expect('-/-/foo').toEqual(foo.canon$({ string: true }))
    expect('$-/-/foo').toEqual(foo.canon$({ string$: true }))
    expect(',,foo').toEqual('' + foo.canon$({ array: true }))
    expect(',,foo').toEqual('' + foo.canon$({ array$: true }))
    expect("{ zone: undefined, base: undefined, name: 'foo' }").toEqual(
      Util.inspect(foo.canon$({ object: true }))
    )
    expect(
      "{ 'zone$': undefined, 'base$': undefined, 'name$': 'foo' }"
    ).toEqual(Util.inspect(foo.canon$({ object$: true })))
    expect(',,foo').toEqual('' + foo.canon$({}))

    const b1_n1 = si.make$('b1/n1')
    expect('-/b1/n1').toEqual(b1_n1.entity$)
    const z1_b1_n1 = si.make$('z1/b1/n1')
    expect('z1/b1/n1').toEqual(z1_b1_n1.entity$)

    let pe = si.make({ entity$: '-/-/a' })
    expect('-/-/a').toEqual(pe.canon$({ string: true }))
    expect('-/-/a').toEqual(pe.entity$)
    pe = si.make({ entity$: '-/b/a' })
    expect('-/b/a').toEqual(pe.entity$)
    expect('-/b/a').toEqual(pe.canon$({ string: true }))
    pe = si.make({ entity$: 'c/b/a' })
    expect('c/b/a').toEqual(pe.entity$)
    expect('c/b/a').toEqual(pe.canon$({ string: true }))

    pe = si.make({ entity$: { name: 'a' } })
    expect('-/-/a').toEqual(pe.canon$({ string: true }))
    expect('-/-/a').toEqual(pe.entity$)
    pe = si.make({ entity$: { base: 'b', name: 'a' } })
    expect('-/b/a').toEqual(pe.entity$)
    expect('-/b/a').toEqual(pe.canon$({ string: true }))
    pe = si.make({ entity$: { zone: 'c', base: 'b', name: 'a' } })
    expect('c/b/a').toEqual(pe.entity$)
    expect('c/b/a').toEqual(pe.canon$({ string: true }))

    let ap = si.make$('a', { x: 1 })
    expect('-/-/a').toEqual(ap.entity$)
    ap = si.make$('b', 'a', { x: 1 })
    expect('-/b/a').toEqual(ap.entity$)
    ap = si.make$('c', 'b', 'a', { x: 1 })
    expect('c/b/a').toEqual(ap.entity$)

    const esc1 = si.make$('esc', { x: 1, y_$: 2 })
    expect(esc1.toString()).toEqual('$-/-/esc;id=;{x:1,y:2}')

    fin()
  })

  test('toString', function (fin) {
    const si = SenecaInstance()
    const f1 = si.make$('foo')
    f1.a = 1
    expect('$-/-/foo;id=;{a:1}').toEqual('' + f1)

    const f2 = si.make$('foo')
    f2.a = 2
    f2.b = 3
    expect('$-/-/foo;id=;{a:2,b:3}').toEqual('' + f2)

    const f3 = f1.make$({ c: 4 })
    f3.d = 5
    expect('$-/-/foo;id=;{c:4,d:5}').toEqual('' + f3)
    fin()
  })

  test('isa', function (fin) {
    const si = SenecaInstance()
    const f1 = si.make$('foo')

    expect(f1.canon$({ isa: 'foo' })).toBeTruthy()
    expect(f1.canon$({ isa: [null, null, 'foo'] })).toBeTruthy()
    expect(f1.canon$({ isa: { name: 'foo' } })).toBeTruthy()

    expect(!f1.canon$({ isa: 'bar' })).toBeTruthy()
    expect(!f1.canon$({ isa: [null, null, 'bar'] })).toBeTruthy()
    expect(!f1.canon$({ isa: { name: 'bar' } })).toBeTruthy()

    const f2 = si.make$('boo/foo')

    expect(f2.canon$({ isa: 'boo/foo' })).toBeTruthy()
    expect(f2.canon$({ isa: [null, 'boo', 'foo'] })).toBeTruthy()
    expect(f2.canon$({ isa: { base: 'boo', name: 'foo' } })).toBeTruthy()

    expect(!f2.canon$({ isa: 'far/bar' })).toBeTruthy()
    expect(!f2.canon$({ isa: [null, 'far', 'bar'] })).toBeTruthy()
    expect(!f2.canon$({ isa: { base: 'far', name: 'bar' } })).toBeTruthy()

    const f3 = si.make$('zoo/boo/foo')

    expect(f3.canon$({ isa: 'zoo/boo/foo' })).toBeTruthy()
    expect(f3.canon$({ isa: ['zoo', 'boo', 'foo'] })).toBeTruthy()
    expect(
      f3.canon$({ isa: { zone: 'zoo', base: 'boo', name: 'foo' } })
    ).toBeTruthy()

    expect(!f3.canon$({ isa: 'zar/far/bar' })).toBeTruthy()
    expect(!f3.canon$({ isa: ['zar', 'far', 'bar'] })).toBeTruthy()
    expect(
      !f3.canon$({ isa: { zone: 'zar', base: 'far', name: 'bar' } })
    ).toBeTruthy()

    fin()
  })

  test('mem-store-import-export', async function () {
    let si = Seneca({ legacy: false }).use('promisify').use('..').test()

    // NOTE: zone is NOT saved! by design!
    let x1 = await si.entity('a', { x: 1 }).save$()
    let x2 = await si.entity('b', 'a', { x: 2 }).save$()
    let x3 = await si.entity('c', 'b', 'a', { x: 3 }).save$()

    let db = await si.post('role:mem-store,cmd:dump')
    let t = Gex(
      '{"undefined":{"a":{"*":{"entity$":"-/-/a","x":1,"id":"*"}}},"b":{"a":{"*":{"entity$":"-/b/a","x":2,"id":"*"},"*":{"entity$":"c/b/a","x":3,"id":"*"}}}}'
    ).on(JSON.stringify(db))
    expect(t).toBeTruthy()

    let out = await si.post('role:mem-store,cmd:export')
    let si2 = SenecaInstance().use('promisify')

    await si2.post('role:mem-store,cmd:import', { json: out.json })
    db = await si2.post('role:mem-store,cmd:dump')
    expect(
      Gex(
        '{"undefined":{"a":{"*":{"entity$":"-/-/a","x":1,"id":"*"}}},"b":{"a":{"*":{"entity$":"-/b/a","x":2,"id":"*"},"*":{"entity$":"c/b/a","x":3,"id":"*"}}}}'
      ).on(JSON.stringify(db))
    ).toBeTruthy()

    let nx1 = await si2.entity('a').load$({ x: 1 })
    expect('$-/-/a;id=' + x1.id + ';{x:1}').toEqual('' + nx1)

    nx1 = await si2.entity('a').load$({ x: 1 })
    expect('$-/-/a;id=' + x1.id + ';{x:1}').toEqual('' + nx1)

    let nx2 = await si2.entity('b', 'a').load$({ x: 2 })
    expect('$-/b/a;id=' + x2.id + ';{x:2}').toEqual('' + nx2)

    let nx3 = await si2.entity('c', 'b', 'a').load$({ x: 3 })
    expect('$c/b/a;id=' + x3.id + ';{x:3}').toEqual('' + nx3)

    await si2.close()
    await si.close()
  })

  test('close', function (fin) {
    const si = SenecaInstance()
    const tmp = { s0: 0, s1: 0, s2: 0 }

    function noopcb(args, cb) {
      cb()
    }

    si.use(function store0() {
      this.store.init(
        this,
        {},
        {
          save: noopcb,
          load: noopcb,
          list: noopcb,
          remove: noopcb,
          native: noopcb,
          close: function (args, cb) {
            tmp.s0++
            cb()
          },
        }
      )
    })

    si.use(function store1() {
      this.store.init(
        this,
        {},
        {
          save: noopcb,
          load: noopcb,
          list: noopcb,
          remove: noopcb,
          native: noopcb,
          nick: '11',
          close: function (args, cb) {
            tmp.s1++
            cb()
          },
        }
      )
    })

    si.use(function store2() {
      this.store.init(
        this,
        { map: { foo: '*' } },
        {
          save: noopcb,
          load: noopcb,
          list: noopcb,
          remove: noopcb,
          native: noopcb,
          nick: '22',
          close: function (args, cb) {
            tmp.s2++
            cb()
          },
        }
      )
    })

    si.close(function (err) {
      if (err) return fin(err)

      // close gets called on all of them
      // any store may have open db connections
      expect(tmp.s0).toEqual(1)
      expect(tmp.s1).toEqual(1)
      expect(tmp.s2).toEqual(1)

      fin()
    })
  })

  test('entity.mapping', function (fin) {
    const si = SenecaInstance()
    si.use('mem-store', { map: { '-/-/foo': '*' } })
    si.use('mem-store', { map: { '-/-/bar': '*' } })

    si.ready(function () {
      const plugins = si.plugins()

      expect(!plugins['mem-store$4']).toBeTruthy()
      expect(plugins['mem-store$3']).toBeTruthy()
      expect(plugins['mem-store$2']).toBeTruthy()
      expect(plugins['mem-store$1']).toBeTruthy()
      expect(!plugins['mem-store$0']).toBeTruthy()

      // TODO: need to be able to introspect store map

      fin()
    })
  })

  test('mem store disabled by user', function (fin) {
    const si = SenecaInstance()
    expect(!si.hasplugin('seneca-mem-store')).toBeTruthy()
    expect(!si.plugins()['seneca-mem-store']).toBeTruthy()

    fin()
  })

  test('exports', function (fin) {
    const si = SenecaInstance()
    const generate_id = si.export('entity/generate_id')

    const id0 = generate_id(6)
    expect(id0.length).toEqual(6)
    fin()
  })

  test('client-server', function (fin) {
    Seneca()
      .test(fin)
      .use(Entity, { server: true })
      .ready(function () {
        const s0 = this
        expect(this.list('role:remote-entity').length).toEqual(4)

        Seneca()
          .test(fin)
          .use(Entity, { client: true })
          .ready(function () {
            const c0 = this

            this.add('role:remote-entity,cmd:load', function (msg, reply) {
              reply()
            })
              .make$('foo')
              .load$(0, function (err, out) {
                c0.close(s0.close.bind(s0, fin))
              })
          })
      })
  })

  test('make-passes-through', function (fin) {
    const si0 = Seneca().test(fin).use(Entity)

    const foo0 = si0.make('foo', { a: 1 })
    expect(foo0.data$()).toMatchObject({ a: 1 })
    foo0.x$ = 2

    const foo1 = si0.make(foo0)
    expect(foo0 === foo1).toBeTruthy()
    expect(foo1.data$()).toMatchObject({ a: 1 })
    expect(foo1.x$).toEqual(2)

    const foo1c = si0.make(foo0.data$())
    expect(foo0 !== foo1c).toBeTruthy()
    expect(foo1 !== foo1c).toBeTruthy()
    expect(foo1c.data$()).toMatchObject({ a: 1 })
    expect(foo1c.x$).toEqual(undefined)

    const bar0 = si0.make('bar', { a: 1 })
    bar0.save$(function (err, bar0a) {
      expect(bar0a.a).toEqual(1)
      bar0a.b = 2
      bar0a.save$(function (err, bar0b) {
        expect(bar0b.a).toEqual(1)
        expect(bar0b.b).toEqual(2)
        expect(bar0a.id).toEqual(bar0b.id)
        fin()
      })
    })
  })

  test('id-handling', function (fin) {
    const si0 = Seneca().test(fin).use(Entity)

    const foo0 = si0.make('foo', { a: 0 })
    foo0.save$(function (err, foo0a) {
      // auto-generated
      expect(foo0a.id.length).toEqual(6)

      const foo1 = si0.make('foo', { id$: 'qaz', a: 1 })
      foo1.save$(function (err, foo1a) {
        // manually specified
        expect(foo1a.id.length).toEqual(3)

        const foo2 = si0.make('foo', { id: 'wsx', a: 2 })
        foo1.save$(function (err, foo2a) {
          // auto-generated - id ignored
          expect(foo2a.id.length).toEqual(6)

          fin()
        })
      })
    })
  })

  test('is-comparison', function (fin) {
    const si0 = Seneca().test(fin).use(Entity)

    const foo0 = si0.make('foo', { a: 0 })
    expect(foo0.is$('foo')).toBeTruthy()
    expect(foo0.is$(foo0.entity$)).toBeTruthy()
    expect(foo0.is$(foo0)).toBeTruthy()
    expect(foo0.is$(foo0.canon$())).toBeTruthy()

    const foo1 = si0.make('foo', { a: 1 })
    expect(foo1.is$('foo')).toBeTruthy()
    expect(foo1.is$(foo0.entity$)).toBeTruthy()
    expect(foo1.is$(foo0)).toBeTruthy()
    expect(foo1.is$(foo0.canon$())).toBeTruthy()

    const bar0 = si0.make('qaz/bar', { a: 0 })
    expect(bar0.is$('qaz/bar')).toBeTruthy()
    expect(bar0.is$(bar0.entity$)).toBeTruthy()
    expect(bar0.is$(bar0)).toBeTruthy()
    expect(bar0.is$(bar0.canon$())).toBeTruthy()

    const bar1 = si0.make('qaz/bar', { a: 1 })
    expect(bar1.is$('qaz/bar')).toBeTruthy()
    expect(bar1.is$(bar0.entity$)).toBeTruthy()
    expect(bar1.is$(bar0)).toBeTruthy()
    expect(bar1.is$(bar0.canon$())).toBeTruthy()

    const zed0 = si0.make('ned/qaz/zed', { a: 0 })
    expect(zed0.is$('ned/qaz/zed')).toBeTruthy()
    expect(zed0.is$(zed0.entity$)).toBeTruthy()
    expect(zed0.is$(zed0)).toBeTruthy()
    expect(zed0.is$(zed0.canon$())).toBeTruthy()

    const zed1 = si0.make('ned/qaz/zed', { a: 1 })
    expect(zed1.is$('ned/qaz/zed')).toBeTruthy()
    expect(zed1.is$(zed0.entity$)).toBeTruthy()
    expect(zed1.is$(zed0)).toBeTruthy()
    expect(zed1.is$(zed0.canon$())).toBeTruthy()

    fin()
  })

  test('multiple-instances', function (fin) {
    const si0 = Seneca()
      .test(fin)
      .use({ init: Entity, name: 'entity', tag: 'A' }, { client: true })
      .use({ init: Entity, name: 'entity', tag: 'B' }, { client: false })
      .use({ init: Entity, name: 'entity', tag: 'C' }, { client: true })
      .use({ init: Entity, name: 'entity', tag: 'D' }, { client: false })

    si0.ready(function () {
      const po = this.options().plugin
      expect(po.entity$A.client).toBeTruthy()
      expect(po.entity$B.client).toBeFalsy()
      expect(po.entity$C.client).toBeTruthy()
      expect(po.entity$D.client).toBeFalsy()
      fin()
    })
  })

  test('deep-clone', function (fin) {
    const si0 = Seneca().test(fin).use(Entity)

    const foo0 = si0.make('foo', {
      a: 0,
      b: { c: 1, d: { e: [{ f: 1 }, { f: 2 }] } },
    })
    const foo1 = foo0.clone$()
    foo1.b.c = 2
    foo1.b.d.e[1].f = 22
    foo1.b.d.e.push({ f: 3 })

    expect(foo0.a).toEqual(0)
    expect(foo1.a).toEqual(0)
    expect(foo0.b.c).toEqual(1)
    expect(foo1.b.c).toEqual(2)
    expect(foo0.b.d.e).toEqual([{ f: 1 }, { f: 2 }])
    expect(foo1.b.d.e).toEqual([{ f: 1 }, { f: 22 }, { f: 3 }])

    const b0 = si0.make('bar').data$({ x: 1, custom$: { n: 2 } })
    expect({ ...b0.custom$ }).toEqual({ n: 2 })
    expect(b0.data$()).toEqual({
      x: 1,
      entity$: { zone: undefined, base: undefined, name: 'bar' },
      custom$: { n: 2 },
    })

    const b1 = b0.clone$()
    expect({ ...b1.custom$ }).toEqual({ n: 2 })
    expect(b1.data$()).toEqual({
      x: 1,
      entity$: { zone: undefined, base: undefined, name: 'bar' },
      custom$: { n: 2 },
    })

    fin()
  })

  test('entity-log-test', function (fin) {
    const tmp = []
    const si = Seneca({
      internal: {
        print: {
          log: (entry) => {
            tmp.push(entry)
          },
        },
      },
    })
      .use(Entity, { log: { active: true } })
      .test('print')
    const fooent = si.make$('foo')
    fooent.log$('foo')

    expect(tmp[0]).toContain('make')
    expect(tmp[1]).toContain('foo')

    fin()
  })

  test('data-null-undef', function (fin) {
    const si = Seneca({ legacy: false }).test(fin).use(Entity)

    const foo = si.make$('foo')
    foo.a = 1
    foo.n = null
    foo.d = void 0

    // undefined is not present
    expect(foo.data$(false)).toEqual({
      a: 1,
      n: null,
    })

    fin()
  })

  test('direct', async () => {
    const si = Seneca({ legacy: false }).test().use('promisify').use(Entity)

    let out = await si.post('sys:entity,cmd:save,name:foo,ent:{id$:a,x:1}')
    expect(out).toEqual({ id: 'a', x: 1, entity$: '-/-/foo' })
    expect(out.toString()).toEqual('$-/-/foo;id=a;{x:1}')
    expect('' + out).toEqual('$-/-/foo;id=a;{x:1}')
    expect(Util.inspect(out)).toEqual(
      "Entity { 'entity$': '-/-/foo', x: 1, id: 'a' }"
    )
  })

  test('custom-basic', function (fin) {
    let si0 = Seneca().test(fin).use(Entity)
    let foo0 = si0.make$('foo').data$({ a: 1, b: 2 })

    // No custom$ properties yet.
    expect(foo0.data$()).toEqual({
      a: 1,
      b: 2,
      entity$: { zone: undefined, base: undefined, name: 'foo' },
    })
    expect(foo0.data$(false)).toEqual({
      a: 1,
      b: 2,
    })
    expect({ ...foo0.custom$ }).toEqual({})

    foo0.custom$.x = 99
    expect(foo0.custom$.x).toEqual(99)
    expect(foo0.data$()).toEqual({
      a: 1,
      b: 2,
      entity$: { zone: undefined, base: undefined, name: 'foo' },
      custom$: { x: 99 },
    })
    expect(foo0.data$(false)).toEqual({
      a: 1,
      b: 2,
    })
    expect(JSON.stringify(foo0)).toEqual('{"entity$":"-/-/foo","a":1,"b":2}')
    expect(Object.keys(foo0)).toEqual(['entity$', 'a', 'b'])

    let y = { z: 88 }
    foo0.custom$({ y }) // NOTE: clones y
    expect(foo0.custom$.x).toEqual(99)
    expect(foo0.custom$.y).toEqual({ z: 88 })

    y.z = 77
    expect(foo0.custom$.x).toEqual(99)
    expect(foo0.custom$.y).toEqual({ z: 88 })

    expect(foo0.data$()).toEqual({
      a: 1,
      b: 2,
      entity$: { zone: undefined, base: undefined, name: 'foo' },
      custom$: { x: 99, y: { z: 88 } },
    })
    expect(foo0.data$(false)).toEqual({
      a: 1,
      b: 2,
    })
    expect(JSON.stringify(foo0)).toEqual('{"entity$":"-/-/foo","a":1,"b":2}')
    expect(Object.keys(foo0)).toEqual(['entity$', 'a', 'b'])

    let foo11 = si0.make$('foo').data$({ a: 11, b: 22 })

    // No custom$ properties yet.
    expect(foo11.data$()).toEqual({
      a: 11,
      b: 22,
      entity$: { zone: undefined, base: undefined, name: 'foo' },
    })

    fin()
  })

  test('custom-directive', function (fin) {
    let si0 = Seneca().test(fin).use(Entity)
    let tmp = { saves: { a: [], b: [] } }

    si0.ready(function () {
      // Define a prior operation driven by the entity custom$ directive
      si0.add('role:entity,cmd:save', function save_what(msg, done) {
        let what = (msg.ent.custom$ && msg.ent.custom$.what) || 'a'
        tmp.saves[what].push(msg.ent.x)
        return this.prior(msg, done)
      })

      // The save_what entity prior is not triggered as no ent.custom$
      si0
        .entity('foo')
        .data$({ x: 1 })
        .save$(function (err, foo1) {
          if (err) return done(err)

          // The save_what entity prior *is* triggered as ent.custom$ defined
          this.entity('foo')
            .data$({ x: 2, custom$: { what: 'b' } })
            .save$(function (err, foo2) {
              if (err) return done(err)

              // The entity custom$ directive does not survive beyond a
              // single operation.
              this.entity('foo')
                .data$({ x: 3 })
                .save$(function (err, foo3) {
                  if (err) return done(err)

                  expect(tmp).toEqual({ saves: { a: [1, 3], b: [2] } })
                  return fin()
                })
            })
        })
    })
  })

  test('drop-callback-meta', function (fin) {
    let s0 = Seneca().test(fin).use(Entity)
    s0.make$('bar').data$({ y: 0 }).save$()

    s0.make$('foo')
      .data$({ x: 0 })
      .save$(function (err, foo0, meta) {
        expect(null == err).toBeTruthy()
        expect(foo0.x).toEqual(0)
        expect(meta.pattern).toEqual('cmd:save,role:entity')
        expect(this.id).toEqual(s0.id)

        let s1 = Seneca()
          .test(fin)
          .use(Entity, { meta: { provide: true } })
        s1.make$('foo')
          .data$({ x: 1 })
          .save$(function (err, foo1, meta) {
            expect(null == err).toBeTruthy()
            expect(foo1.x).toEqual(1)
            expect(meta.pattern).toEqual('cmd:save,role:entity')
            expect(this.id).toEqual(s1.id)

            let s2 = Seneca()
              .test(fin)
              .use(Entity, { meta: { provide: false } })
            s2.make$('foo')
              .data$({ x: 2 })
              .save$(function (err, foo2, meta) {
                expect(null == err).toBeTruthy()
                expect(foo2.x).toEqual(2)
                expect(meta).toEqual(undefined)
                expect(this.id).toEqual(s2.id)

                s2.make$('bar').data$({ y: 2 }).save$()

                fin()
              })
          })
      })
  })
})
