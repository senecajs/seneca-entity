
const Seneca = require('seneca')
const Entity = require('..')

const dur = 5000


let seneca = Seneca({legacy:false, xlog:'silent'})
    .test()
    .use(Entity)
    .ready(function() {
      let foo0 = seneca.make$('foo')
      console.log('foo0', foo0)
    })


