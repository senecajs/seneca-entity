/* Copyright (c) 2022 Richard Rodger and other contributors, MIT License */

const Seneca = require('seneca')
const Entity = require('../')

const Gubu = Seneca.util.Gubu

describe('valid', function () {
  test('happy', async function () {
    const seneca = Seneca().test().use(Entity,{
      ent: {
        '-/-/foo': {
          valid: ()=>({
            a: Number
          }),
        },
        '-/bar/foo': {
          valid: Gubu({
            a: Number,
            b: { x: String }
          }),
        },
        '-/zed/-': {
          valid_json: JSON.parse(`{
            "c": "Boolean",
            "b": { "$$":"Open()", "x": "\\"X\\"" }
          }`),
        },
      }
    })

    const foo0 = await seneca.entity('foo').save$({a:1})
    expect(foo0.entity$).toEqual('-/-/foo')
    expect(foo0.data$(false)).toMatchObject({a:1})

    try {
      await seneca.entity('foo').save$({a:'A'})
      expect(false).toEqual(true)
    }
    catch(e) {
      expect(e.props).toEqual([ { path: 'a', what: 'type', type: 'number', value: 'A' } ])
    }

    try {
      await seneca.entity('foo').save$({a:1,c:true})
      expect(false).toEqual(true)
    }
    catch(e) {
      // TODO: much better props entry needed for this error
      // expect(e.props).toEqual()
    }

    // TODO: need to validate id$ too!
    const foo3 = await seneca.entity('foo').save$({id$:'a3',a:3})
    expect(foo3.entity$).toEqual('-/-/foo')
    expect(foo3.data$(false)).toMatchObject({id:'a3',a:3})


    const barfoo0 = await seneca.entity('bar/foo').save$({a:1,b:{x:'X'}})
    expect(barfoo0.entity$).toEqual('-/bar/foo')
    expect(barfoo0.data$(false)).toMatchObject({a:1,b:{x:'X'}})

    try {
      await seneca.entity('bar/foo').save$({a:'A',b:{x:'X'}})
      expect(false).toEqual(true)
    }
    catch(e) {
      expect(e.props).toEqual([ { path: 'a', what: 'type', type: 'number', value: 'A' } ])
    }

  })
})
