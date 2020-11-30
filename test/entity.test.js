'use strict'

var Util = require('util')
var Assert = require('assert')

var Async = require('async')
var { Gex } = require('gex')
var Lab = require('@hapi/lab')
var Code = require('@hapi/code')
var Seneca = require('seneca')
var Entity = require('../')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = make_it(lab)
var beforeEach = lab.beforeEach
var assert = Assert
var expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')

var SenecaInstance = function () {
  var seneca = Seneca({
    log: 'silent',
    default_plugins: {
      entity: false,
      'mem-store': false,
    },
    plugins: [Entity],
  })

  return seneca
}

var si
describe('entity', function () {
  beforeEach({}, function (fin) {
    si = SenecaInstance()
    if (si.version >= '3.0.0') {
      si.ready(fin)
    } else {
      fin()
    }
  })

  lab.it('validate', PluginValidator(Entity, module))

  it('happy-mem', function (fin) {
    si.test(fin)

    var fooent = si.make$('foo')
    assert.ok(fooent.is$('foo'))
    assert.ok(!fooent.is$('bar'))

    fooent.data$({ a: 1, b: 2 }).save$(function (err, out) {
      assert.equal(err, null)
      assert.ok(out.id)
      assert.equal(1, out.a)
      assert.equal(2, out.b)

      si.close(fin)
    })
  })

  lab.it('happy-mem-promise', async function () {
    var si = Seneca({ legacy: false }).use('promisify').use('..').test()

    var fooent = si.entity('foo')

    assert.ok(fooent.is$('foo'))
    assert.ok(!fooent.is$('bar'))

    var out = await fooent.data$({ a: 1, b: 2 }).save$()

    assert.ok(out.id)
    assert.equal(1, out.a)
    assert.equal(2, out.b)

    await si.close()
  })

  it('happy-mem-zone-base-name', function (fin) {
    si.test(fin)

    var z0b0n0ent = si.make$('z0/b0/n0')
    assert.ok(z0b0n0ent.is$('z0/b0/n0'))
    assert.ok(!z0b0n0ent.is$('z0/b0/n1'))

    z0b0n0ent.data$({ a: 1, b: 2 }).save$(function (err, out) {
      assert.equal(err, null)
      assert.ok(out.id)
      assert.equal(1, out.a)
      assert.equal(2, out.b)

      si.close(fin)
    })
  })

  lab.it('entity-promise', async () => {
    var si = Seneca({ legacy: false }).use('promisify').use('..').test()

    var bar0 = si.entity('bar').data$({ a: 1 })
    expect('' + bar0).equal('$-/-/bar;id=;{a:1}')

    var bar1 = si.entity('bar', { a: 2 })
    expect('' + bar1).equal('$-/-/bar;id=;{a:2}')

    var bar2 = si.entity('bar')
    bar2.a = 3
    expect('' + bar2).equal('$-/-/bar;id=;{a:3}')

    var bar10 = si.make('bar').data$({ a: 1 })
    expect('' + bar10).equal('$-/-/bar;id=;{a:1}')

    var bar11 = si.make('bar', { a: 2 })
    expect('' + bar11).equal('$-/-/bar;id=;{a:2}')

    var bar12 = si.make('bar')
    bar12.a = 3
    expect('' + bar12).equal('$-/-/bar;id=;{a:3}')

    var foo0 = await si.entity('foo').data$({ a: 1 }).save$()

    var foo1 = await si.entity('foo').load$(foo0.id)
    expect('' + foo0).equal('' + foo1)

    var foo2 = await si.entity('foo').data$({ a: 1 }).save$()
    var list = await si.entity('foo').list$({ a: 1 })
    expect(list.length).equal(2)

    await foo0.remove$()
    list = await si.entity('foo').list$({ a: 1 })
    expect(list.length).equal(1)

    var foo3 = list[0].clone$()
    foo3.a = 2
    await foo3.save$()

    var foo4 = await list[0].load$()
    expect(foo4.a).equal(2)

    var zed0 = await si.entity('core/zed').data$({ z: 0 }).save$()
    var zed1 = await si.entity('core/zed').data$({ z: 1 }).save$()
    var zeds = await si.entity('core/zed').list$()
    expect(zeds.length).equal(2)

    await si.entity('core/zed').remove$({ z: 1 })
    zeds = await si.entity('core/zed').list$()
    expect(zeds.length).equal(1)
  })

  it('tag-load', function (fin) {
    var s0 = Seneca().test(fin).use('../').use('../').use('../$a').use('../$b')
    fin()
  })

  it('plain-messages', function (fin) {
    var s0 = Seneca().test(fin).use(Entity)

    s0.gate()
      .act(
        'role:entity,cmd:save,base:b0,name:n0',
        { ent: { id$: 'e0', f0: 1 } },
        function (err, out) {
          expect(out.data$()).equals({
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
          expect(out.data$()).equals({
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
          expect(out.data$()).equals({
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
          expect(out[0].data$()).equals({
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
          expect(out[0].data$()).equals({
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
          expect(out).not.exist()
        }
      )
      .act(
        'role:entity,cmd:list,base:b0,name:n0',
        { q: { id: 'e0' } },
        function (err, out) {
          expect(out.length).equals(0)
        }
      )

      .ready(fin)
  })

  it('reify_entity_wrap_without_ent', function (fin) {
    var w0 = Entity.intern.store.reify_entity_wrap(function (msg, reply) {
      expect(msg.q).equal({})
      expect(msg.qent.entity$).equal('z0/b0/n0')
      reply()
    })

    w0.call(si, { role: 'entity', zone: 'z0', base: 'b0', name: 'n0' }, fin)
  })

  it('reify_entity_wrap_with_ent', function (fin) {
    var w0 = Entity.intern.store.reify_entity_wrap(function (msg, reply) {
      expect(msg.q).not.exist()
      expect(msg.qent).not.exist()
      expect(msg.ent.entity$).equal('z0/b0/n0')
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

  it('cmd_wrap_list', function (fin) {
    var w0 = Entity.intern.store.cmd_wrap.list(function (msg, reply) {
      expect(msg.sort).equal({ foo: -1 })
      reply()
    })

    w0.call(si, { role: 'entity', cmd: 'list', name: 'n0', sort: '-foo' }, fin)
  })

  it('common', function (fin) {
    expect(Entity.intern.common.generate_id(3).length).equal(3)
    expect(Entity.intern.common.generate_id({ length: 1 }).length).equal(1)
    expect(Entity.intern.common.generate_id(66).length).equal(66)

    // default length
    expect(Entity.intern.common.generate_id().length).equal(6)
    expect(Entity.intern.common.generate_id(0).length).equal(6)

    Entity.intern.common.generate_id(null, function (n) {
      expect(n.length).equal(6)
      fin()
    })
  })

  it('setid-mem', function (fin) {
    var z0 = si.make('zed')
    z0.id$ = 0
    z0.z = 0
    z0.save$(function (e, z) {
      assert.equal(0, z.id)
      assert.equal(0, z.z)

      si.make('zed', { id$: 1, z: 1 }).save$(function (e, z) {
        assert.equal(1, z.id)
        assert.equal(1, z.z)

        si.make('zed')
          .data$({ id$: 2, z: 2 })
          .save$(function (e, z) {
            assert.equal(2, z.id)
            assert.equal(2, z.z)

            si.close(fin)
          })
      })
    })
  })

  // TODO: promisify in Seneca 4
  it('mem-ops', require('./mem-ops.js')(SenecaInstance()))

  it('parsecanon', function (fin) {
    function def(v, d) {
      return v == null ? d : v
    }
    function fmt(cn) {
      return (
        def(cn.zone, '-') + '/' + def(cn.base, '-') + '/' + def(cn.name, '-')
      )
    }

    assert.equal('-/-/n1', fmt(si.util.parsecanon('n1')))
    assert.equal('-/b1/n1', fmt(si.util.parsecanon('b1/n1')))
    assert.equal('z1/b1/n1', fmt(si.util.parsecanon('z1/b1/n1')))

    assert.equal('-/-/-', fmt(si.util.parsecanon('-')))
    assert.equal('-/-/-', fmt(si.util.parsecanon('-/-')))
    assert.equal('-/-/-', fmt(si.util.parsecanon('-/-/-')))
    assert.equal('-/-/0', fmt(si.util.parsecanon('0')))
    assert.equal('-/0/0', fmt(si.util.parsecanon('0/0')))
    assert.equal('0/0/0', fmt(si.util.parsecanon('0/0/0')))

    var fail
    try {
      si.util.parsecanon('')
      fail = ''
    } catch (e) {
      assert.equal('invalid_canon', e.code)
    }

    try {
      si.util.parsecanon('?')
      fail = '?'
    } catch (e) {
      assert.equal('invalid_canon', e.code)
    }

    assert.equal(fail, void 0, fail)

    var foo = si.make$('foo')
    assert.equal('a/b/c', fmt(foo.canon$({ parse: 'a/b/c' })))
    si.close(fin)
  })

  // TODO: a bit more please!
  it('load', function (fin) {
    var foo = si.make$('foo')
    foo.load$(null, function () {
      expect(this.seneca).exists()
      fin()
    })
  })

  // TODO: a bit more please!
  it('remove', function (fin) {
    var foo = si.make$('foo')
    foo.remove$(null, function () {
      expect(this.seneca).exists()
      fin()
    })
  })

  it('fields-directive', function (fin) {
    si.test(fin)
    si.make$('fdent', { a: 1, b: 2 }).save$(function (err, out0) {
      out0.load$({ id: out0.id, fields$: ['a'] }, function (err, out1) {
        expect(out1.a).equals(1)
        expect(out1.b).not.exists()

        out0.list$({ id: out0.id, fields$: ['b'] }, function (err, list) {
          expect(list[0].b).equals(2)
          expect(list[0].a).not.exists()

          fin()
        })
      })
    })
  })

  it('make', function (fin) {
    var foo = si.make$('foo')
    assert.equal('-/-/foo', foo.entity$)
    assert.equal('-/-/foo', foo.canon$())
    assert.equal('-/-/foo', foo.canon$({ string: true }))
    assert.equal('$-/-/foo', foo.canon$({ string$: true }))
    assert.equal(',,foo', '' + foo.canon$({ array: true }))
    assert.equal(',,foo', '' + foo.canon$({ array$: true }))
    assert.equal(
      "{ zone: undefined, base: undefined, name: 'foo' }",
      Util.inspect(foo.canon$({ object: true }))
    )
    assert.equal(
      "{ 'zone$': undefined, 'base$': undefined, 'name$': 'foo' }",
      Util.inspect(foo.canon$({ object$: true }))
    )
    assert.equal(',,foo', '' + foo.canon$({}))

    var b1_n1 = si.make$('b1/n1')
    assert.equal('-/b1/n1', b1_n1.entity$)
    var z1_b1_n1 = si.make$('z1/b1/n1')
    assert.equal('z1/b1/n1', z1_b1_n1.entity$)

    var pe = si.make({ entity$: '-/-/a' })
    assert.equal('-/-/a', pe.canon$({ string: true }))
    assert.equal('-/-/a', pe.entity$)
    pe = si.make({ entity$: '-/b/a' })
    assert.equal('-/b/a', pe.entity$)
    assert.equal('-/b/a', pe.canon$({ string: true }))
    pe = si.make({ entity$: 'c/b/a' })
    assert.equal('c/b/a', pe.entity$)
    assert.equal('c/b/a', pe.canon$({ string: true }))

    pe = si.make({ entity$: { name: 'a' } })
    assert.equal('-/-/a', pe.canon$({ string: true }))
    assert.equal('-/-/a', pe.entity$)
    pe = si.make({ entity$: { base: 'b', name: 'a' } })
    assert.equal('-/b/a', pe.entity$)
    assert.equal('-/b/a', pe.canon$({ string: true }))
    pe = si.make({ entity$: { zone: 'c', base: 'b', name: 'a' } })
    assert.equal('c/b/a', pe.entity$)
    assert.equal('c/b/a', pe.canon$({ string: true }))

    var ap = si.make$('a', { x: 1 })
    assert.equal('-/-/a', ap.entity$)
    ap = si.make$('b', 'a', { x: 1 })
    assert.equal('-/b/a', ap.entity$)
    ap = si.make$('c', 'b', 'a', { x: 1 })
    assert.equal('c/b/a', ap.entity$)

    var esc1 = si.make$('esc', { x: 1, y_$: 2 })
    assert.equal(esc1.toString(), '$-/-/esc;id=;{x:1,y:2}')

    fin()
  })

  it('toString', function (fin) {
    var f1 = si.make$('foo')
    f1.a = 1
    assert.equal('$-/-/foo;id=;{a:1}', '' + f1)

    var f2 = si.make$('foo')
    f2.a = 2
    f2.b = 3
    assert.equal('$-/-/foo;id=;{a:2,b:3}', '' + f2)

    var f3 = f1.make$({ c: 4 })
    f3.d = 5
    assert.equal('$-/-/foo;id=;{c:4,d:5}', '' + f3)
    fin()
  })

  it('isa', function (fin) {
    var f1 = si.make$('foo')

    assert.ok(f1.canon$({ isa: 'foo' }))
    assert.ok(f1.canon$({ isa: [null, null, 'foo'] }))
    assert.ok(f1.canon$({ isa: { name: 'foo' } }))

    assert.ok(!f1.canon$({ isa: 'bar' }))
    assert.ok(!f1.canon$({ isa: [null, null, 'bar'] }))
    assert.ok(!f1.canon$({ isa: { name: 'bar' } }))

    var f2 = si.make$('boo/foo')

    assert.ok(f2.canon$({ isa: 'boo/foo' }))
    assert.ok(f2.canon$({ isa: [null, 'boo', 'foo'] }))
    assert.ok(f2.canon$({ isa: { base: 'boo', name: 'foo' } }))

    assert.ok(!f2.canon$({ isa: 'far/bar' }))
    assert.ok(!f2.canon$({ isa: [null, 'far', 'bar'] }))
    assert.ok(!f2.canon$({ isa: { base: 'far', name: 'bar' } }))

    var f3 = si.make$('zoo/boo/foo')

    assert.ok(f3.canon$({ isa: 'zoo/boo/foo' }))
    assert.ok(f3.canon$({ isa: ['zoo', 'boo', 'foo'] }))
    assert.ok(f3.canon$({ isa: { zone: 'zoo', base: 'boo', name: 'foo' } }))

    assert.ok(!f3.canon$({ isa: 'zar/far/bar' }))
    assert.ok(!f3.canon$({ isa: ['zar', 'far', 'bar'] }))
    assert.ok(!f3.canon$({ isa: { zone: 'zar', base: 'far', name: 'bar' } }))

    fin()
  })

  it('mem-store-import-export', function (fin) {
    let si = Seneca({ legacy: false }).use('promisify').use('..').test()

    // NOTE: zone is NOT saved! by design!
    var x1, x2, x3

    Async.series(
      [
        function (next) {
          si.make$('a', { x: 1 }).save$(function (e, o) {
            x1 = o
            next()
          })
        },
        function (next) {
          si.make$('b', 'a', { x: 2 }).save$(function (e, o) {
            x2 = o
            next()
          })
        },
        function (next) {
          si.make$('c', 'b', 'a', { x: 3 }).save$(function (e, o) {
            x3 = o
            next()
          })
        },

        function (next) {
          si.act('role:mem-store,cmd:dump', function (e, o) {
            var t = Gex(
              '{"undefined":{"a":{"*":{"entity$":"-/-/a","x":1,"id":"*"}}},"b":{"a":{"*":{"entity$":"-/b/a","x":2,"id":"*"},"*":{"entity$":"c/b/a","x":3,"id":"*"}}}}'
            ).on(JSON.stringify(o))
            assert.ok(t)
            next(e)
          })
        },

        function (next) {
          si.act('role:mem-store,cmd:export', function (err, out) {
            assert.equal(err, null)

            var si2 = SenecaInstance()

            si2.act(
              'role:mem-store,cmd:import',
              { json: out.json },
              function (err) {
                assert.equal(err, null)

                si2.act('role:mem-store,cmd:dump', function (err, o) {
                  assert.equal(err, null)
                  assert.ok(
                    Gex(
                      '{"undefined":{"a":{"*":{"entity$":"-/-/a","x":1,"id":"*"}}},"b":{"a":{"*":{"entity$":"-/b/a","x":2,"id":"*"},"*":{"entity$":"c/b/a","x":3,"id":"*"}}}}'
                    ).on(JSON.stringify(o))
                  )

                  si2.make('a').load$({ x: 1 }, function (err, nx1) {
                    assert.equal(err, null)
                    assert.equal('$-/-/a;id=' + x1.id + ';{x:1}', '' + nx1)

                    si2.make('a').load$({ x: 1 }, function (err, nx1) {
                      assert.equal(err, null)
                      assert.equal('$-/-/a;id=' + x1.id + ';{x:1}', '' + nx1)

                      si2.make('b', 'a').load$({ x: 2 }, function (err, nx2) {
                        assert.equal(err, null)
                        assert.equal('$-/b/a;id=' + x2.id + ';{x:2}', '' + nx2)

                        si2
                          .make('c', 'b', 'a')
                          .load$({ x: 3 }, function (err, nx3) {
                            assert.equal(err, null)
                            assert.equal(
                              '$c/b/a;id=' + x3.id + ';{x:3}',
                              '' + nx3
                            )
                            si2.close()

                            next()
                          })
                      })
                    })
                  })
                })
              }
            )
          })
        },
      ],
      function (err) {
        si.close()
        fin(err)
      }
    )
  })

  it('close', function (fin) {
    var tmp = { s0: 0, s1: 0, s2: 0 }

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
      assert.equal(1, tmp.s0)
      assert.equal(1, tmp.s1)
      assert.equal(1, tmp.s2)

      fin()
    })
  })

  it('entity.mapping', function (fin) {
    si.use('mem-store', { map: { '-/-/foo': '*' } })
    si.use('mem-store', { map: { '-/-/bar': '*' } })

    si.ready(function () {
      var plugins = si.plugins()

      assert.ok(!plugins['mem-store$4'])
      assert.ok(plugins['mem-store$3'])
      assert.ok(plugins['mem-store$2'])
      assert.ok(plugins['mem-store$1'])
      assert.ok(!plugins['mem-store$0'])

      // TODO: need to be able to introspect store map

      fin()
    })
  })

  it('mem store disabled by user', function (fin) {
    assert.ok(!si.hasplugin('seneca-mem-store'))
    assert.ok(!si.plugins()['seneca-mem-store'])

    fin()
  })

  it('exports', function (fin) {
    var generate_id = si.export('entity/generate_id')

    var id0 = generate_id(6)
    Assert(6 === id0.length)
    fin()
  })

  it('client-server', function (fin) {
    Seneca()
      .test(fin)
      .use(Entity, { server: true })
      .ready(function () {
        var s0 = this
        expect(this.list('role:remote-entity')).length(4)

        Seneca()
          .test(fin)
          .use(Entity, { client: true })
          .ready(function () {
            var c0 = this

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

  it('make-passes-through', function (fin) {
    var si0 = Seneca().test(fin).use(Entity)

    var foo0 = si0.make('foo', { a: 1 })
    expect(foo0.data$()).contains({ a: 1 })
    foo0.x$ = 2

    var foo1 = si0.make(foo0)
    expect(foo0 === foo1).true()
    expect(foo1.data$()).contains({ a: 1 })
    expect(foo1.x$).equals(2)

    var foo1c = si0.make(foo0.data$())
    expect(foo0 !== foo1c).true()
    expect(foo1 !== foo1c).true()
    expect(foo1c.data$()).contains({ a: 1 })
    expect(foo1c.x$).not.exists()

    var bar0 = si0.make('bar', { a: 1 })
    bar0.save$(function (err, bar0a) {
      expect(bar0a.a).equal(1)
      bar0a.b = 2
      bar0a.save$(function (err, bar0b) {
        expect(bar0b.a).equal(1)
        expect(bar0b.b).equal(2)
        expect(bar0a.id).equal(bar0b.id)
        fin()
      })
    })
  })

  it('id-handling', function (fin) {
    var si0 = Seneca().test(fin).use(Entity)

    var foo0 = si0.make('foo', { a: 0 })
    foo0.save$(function (err, foo0a) {
      // auto-generated
      expect(foo0a.id.length).equal(6)

      var foo1 = si0.make('foo', { id$: 'qaz', a: 1 })
      foo1.save$(function (err, foo1a) {
        // manually specified
        expect(foo1a.id.length).equal(3)

        var foo2 = si0.make('foo', { id: 'wsx', a: 2 })
        foo1.save$(function (err, foo2a) {
          // auto-generated - id ignored
          expect(foo2a.id.length).equal(6)

          fin()
        })
      })
    })
  })

  it('is-comparison', function (fin) {
    var si0 = Seneca().test(fin).use(Entity)

    var foo0 = si0.make('foo', { a: 0 })
    expect(foo0.is$('foo')).true()
    expect(foo0.is$(foo0.entity$)).true()
    expect(foo0.is$(foo0)).true()
    expect(foo0.is$(foo0.canon$())).true()

    var foo1 = si0.make('foo', { a: 1 })
    expect(foo1.is$('foo')).true()
    expect(foo1.is$(foo0.entity$)).true()
    expect(foo1.is$(foo0)).true()
    expect(foo1.is$(foo0.canon$())).true()

    var bar0 = si0.make('qaz/bar', { a: 0 })
    expect(bar0.is$('qaz/bar')).true()
    expect(bar0.is$(bar0.entity$)).true()
    expect(bar0.is$(bar0)).true()
    expect(bar0.is$(bar0.canon$())).true()

    var bar1 = si0.make('qaz/bar', { a: 1 })
    expect(bar1.is$('qaz/bar')).true()
    expect(bar1.is$(bar0.entity$)).true()
    expect(bar1.is$(bar0)).true()
    expect(bar1.is$(bar0.canon$())).true()

    var zed0 = si0.make('ned/qaz/zed', { a: 0 })
    expect(zed0.is$('ned/qaz/zed')).true()
    expect(zed0.is$(zed0.entity$)).true()
    expect(zed0.is$(zed0)).true()
    expect(zed0.is$(zed0.canon$())).true()

    var zed1 = si0.make('ned/qaz/zed', { a: 1 })
    expect(zed1.is$('ned/qaz/zed')).true()
    expect(zed1.is$(zed0.entity$)).true()
    expect(zed1.is$(zed0)).true()
    expect(zed1.is$(zed0.canon$())).true()

    fin()
  })

  it('multiple-instances', function (fin) {
    var si0 = Seneca()
      .test(fin)
      .use({ init: Entity, name: 'entity', tag: 'A' }, { client: true })
      .use({ init: Entity, name: 'entity', tag: 'B' }, { client: false })
      .use({ init: Entity, name: 'entity', tag: 'C' }, { client: true })
      .use({ init: Entity, name: 'entity', tag: 'D' }, { client: false })

    si0.ready(function () {
      var po = this.options().plugin
      expect(po.entity$A.client).true()
      expect(po.entity$B.client).false()
      expect(po.entity$C.client).true()
      expect(po.entity$D.client).false()
      fin()
    })
  })

  it('deep-clone', function (fin) {
    var si0 = Seneca().test(fin).use(Entity)

    var foo0 = si0.make('foo', {
      a: 0,
      b: { c: 1, d: { e: [{ f: 1 }, { f: 2 }] } },
    })
    var foo1 = foo0.clone$()
    foo1.b.c = 2
    foo1.b.d.e[1].f = 22
    foo1.b.d.e.push({ f: 3 })

    expect(foo0.a).equal(0)
    expect(foo1.a).equal(0)
    expect(foo0.b.c).equal(1)
    expect(foo1.b.c).equal(2)
    expect(foo0.b.d.e).equal([{ f: 1 }, { f: 2 }])
    expect(foo1.b.d.e).equal([{ f: 1 }, { f: 22 }, { f: 3 }])

    fin()
  })

  it('entity-log-test', function (fin) {
    var tmp = []
    var si = Seneca({
      internal: {
        print: {
          log: (entry) => {
            tmp.push(entry)
          },
        },
      },
    })
      .use(Entity)
      .test('print')
    var fooent = si.make$('foo')
    fooent.log$('foo')

    expect(tmp[0]).contains('make')
    expect(tmp[1]).contains('foo')

    fin()
  })

  it('data-null-undef', function (fin) {
    var si = Seneca({ legacy: false }).test(fin).use(Entity)

    var foo = si.make$('foo')
    foo.a = 1
    foo.n = null
    foo.d = void 0

    // undefined is not present
    expect(foo.data$(false)).equals({
      a: 1,
      n: null,
    })

    fin()
  })

  lab.it('direct', async () => {
    var si = Seneca({ legacy: false }).test().use('promisify').use(Entity)

    let out = await si.post('sys:entity,cmd:save,name:foo,ent:{id$:a,x:1}')
    expect(out).equals({ id: 'a', x: 1, entity$: '-/-/foo' })
    expect(out.toString()).equals('$-/-/foo;id=a;{x:1}')
    expect('' + out).equals('$-/-/foo;id=a;{x:1}')
    expect(Util.inspect(out)).equals(
      "Entity { 'entity$': '-/-/foo', x: 1, id: 'a' }"
    )
  })
})

function make_it(lab) {
  return function it(name, opts, func) {
    if ('function' === typeof opts) {
      func = opts
      opts = {}
    }

    lab.it(
      name,
      opts,
      Util.promisify(function (x, fin) {
        func(fin)
      })
    )
  }
}
