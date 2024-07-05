
const Seneca = require('seneca')
const Entity = require('..')


const Gubu = Seneca.util.Gubu


async function run() {
  let valid_foo = {
    id: String,
    a: Number,
    b: {
      x: String
    },
    c: 'C',
  }

  let valid_foo_gubu = Gubu(valid_foo)
  console.log('valid_foo_gubu', valid_foo_gubu.stringify())
  
  let valid_foo_json = valid_foo_gubu.jsonify()
  console.log('valid_foo_json', valid_foo_json)

  console.log('JSONIFY',Gubu.build(valid_foo_json).stringify())
  
  
  let s0 = Seneca().test().use(Entity, {
    ent: {
      '-/-/foo': {
        valid_json: valid_foo_json
        // valid: valid_foo
        // valid: valid_foo_gubu
      }
    }
  })

  let x0 = await s0.entity('foo').save$({a:1,b:{x:'X'}})
  console.log('x0', x0)

  let x0r = await s0.entity('foo').load$({id:x0.id,fields$:['a']})
  console.log('x0r', x0r)

  x0r.a = 2
  let x0r1 = await x0r.save$()
  console.log('x0r1', x0r1)

  x0r1.a = 'A'
  let x0r2 = await x0r1.save$()
  console.log('x0r2', x0r2)

}

run()
