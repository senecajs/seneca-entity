/* Copyright (c) 2022 Richard Rodger and other contributors, MIT License */

const Seneca = require('seneca')
const Entity = require('../')

const Gubu = Seneca.util.Gubu

describe('valid', function () {
  test('happy', async function () {
    const seneca = Seneca()
      .test()
      .use(Entity, {
        ent: {
          '-/-/foo': {
            valid: () => ({
              a: Number,
            }),
          },
          '-/bar/foo': {
            valid: Gubu({
              a: Number,
              b: { x: String },
            }),
          },
          '-/zed/-': {
            valid_json: JSON.parse(`{
            "c": "Boolean",
            "b": { "$$":"Open()", "x": "\\"X\\"" }
          }`),
          },
        },
      })

    const foo0 = await seneca.entity('foo').save$({ a: 1 })
    expect(foo0.entity$).toEqual('-/-/foo')
    expect(foo0.data$(false)).toMatchObject({ a: 1 })

    try {
      await seneca.entity('foo').save$({ a: 'A' })
      expect(false).toEqual(true)
    } catch (e) {
      // console.log(e)
      expect(e.props).toEqual([
        { path: 'a', what: 'type', type: 'number', value: 'A' },
      ])
    }

    try {
      await seneca.entity('foo').save$({ a: 1, c: true })
      expect(false).toEqual(true)
    } catch (e) {
      // TODO: much better props entry needed for this error
      // expect(e.props).toEqual()
    }

    // TODO: need to validate id$ too!
    const foo3 = await seneca.entity('foo').save$({ id$: 'a3', a: 3 })
    expect(foo3.entity$).toEqual('-/-/foo')
    expect(foo3.data$(false)).toMatchObject({ id: 'a3', a: 3 })

    const barfoo0 = await seneca
      .entity('bar/foo')
      .save$({ a: 1, b: { x: 'X' } })
    expect(barfoo0.entity$).toEqual('-/bar/foo')
    expect(barfoo0.data$(false)).toMatchObject({ a: 1, b: { x: 'X' } })

    try {
      await seneca.entity('bar/foo').save$({ a: 'A', b: { x: 'X' } })
      expect(false).toEqual(true)
    } catch (e) {
      expect(e.props).toEqual([
        { path: 'a', what: 'type', type: 'number', value: 'A' },
      ])
    }

    const zed0 = await seneca.entity('zed/qaz').save$({ c: true, b: {} })
    expect(zed0.entity$).toEqual('-/zed/qaz')
    expect(zed0.data$(false)).toMatchObject({ c: true, b: { x: 'X' } })
  })

  test('skip', async function () {
    const seneca = Seneca()
      .test()
      .use(Entity, {
        ent: {
          '-/-/foo': {
            valid_json: {
              $$: 'Open',
              a: 'Number',
            },
          },
        },
      })

    const foo0 = await seneca.entity('foo').save$({ a: 1, b: 2 })
    expect(foo0.entity$).toEqual('-/-/foo')
    expect(foo0.data$(false)).toMatchObject({ a: 1, b: 2 })

    const foo0a = await seneca.entity('foo').load$(foo0.id)
    const foo0as = await foo0a.save$({ b: 22, skip$: ['a'] })
    expect(foo0as.entity$).toEqual('-/-/foo')
    expect(foo0as.data$(false)).toMatchObject({ a: 1, b: 22 })
  })

  test('strict', async function () {
    const seneca = Seneca()
      .test()
      .use(Entity, {
        strict: true,
        ent: {
          '-/-/foo': {},
          '-/zed/bar': {
            valid_json: {
              a: 'Number',
            },
          },
        },
      })

    const foo0 = seneca.entity('foo')
    expect(foo0.entity$).toEqual('-/-/foo')

    const bar0 = seneca.entity('zed/bar')
    expect(bar0.entity$).toEqual('-/zed/bar')

    try {
      seneca.entity('notanentity')
      expect(false).toEqual(true)
    } catch (e) {
      expect(e.message).toMatch('notanentity')
    }

    const foo1 = await seneca.entity('foo').save$({ a: 1 })
    expect(foo1).toMatchObject({ entity$: '-/-/foo', a: 1 })

    const bar1 = await seneca.entity('zed/bar').save$({ a: 2 })
    expect(bar1).toMatchObject({ entity$: '-/zed/bar', a: 2 })

    try {
      await seneca.entity('zed/bar').save$({})
    } catch (e) {
      expect(e.props[0]).toEqual({
        path: 'a',
        what: 'required',
        type: 'number',
        value: undefined,
      })
    }
  })

  test('method', async function () {
    const seneca = Seneca()
      .test()
      .use(Entity, {
        ent: {
          '-/-/foo': {},
          'qaz/zed/bar': {
            valid_json: {
              a: 'Number',
              x: 2,
            },
          },
          'wax/-/-': {
            valid_json: {
              b: 'Number',
            },
          },
        },
      })

    const foo0 = seneca.entity('foo')
    expect(foo0.valid$()).toEqual(true)

    const nim0 = seneca.entity('nim')
    expect(nim0.valid$()).toEqual(true)

    const bar0 = seneca.entity('qaz/zed/bar').data$({ a: 1 })
    expect(bar0.valid$()).toEqual(true)
    expect(bar0.data$(false)).toEqual({ a: 1, x: 2 })

    const wax0 = seneca.entity('wax/wex/wix').data$({ b: 3 })
    expect(wax0.valid$()).toEqual(true)
    expect(wax0.data$(false)).toEqual({ b: 3 })

    const bar1 = seneca.entity('qaz/zed/bar').data$({ a: 'A' })
    expect(bar1.valid$()).toEqual(false)
    expect(bar1.data$(false)).toEqual({ a: 'A' })

    try {
      bar1.valid$({ throws: true })
      expect(true).equal(false)
    } catch (e) {
      // console.log(e)
      expect(e.props).toEqual([
        { path: 'a', what: 'type', type: 'number', value: 'A' },
      ])
    }

    const errs0 = bar1.valid$({ errors: true })
    // console.log(errs0)
    expect(errs0[0]).toMatchObject({
      key: 'a',
      type: 'number',
      value: 'A',
      path: 'a',
      why: 'type',
      check: 'none',
      args: {},
      mark: 1050,
      text:
        'Validation failed for property "a" with string "A" because ' +
        'the string is not of type number.',
      use: {},
    })
  })
})
