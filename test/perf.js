const Seneca = require('seneca')
const Entity = require('..')

const dur = 5000

let seneca = Seneca({ legacy: false, log: 'silent' })
  .use(Entity)
  .ready(function () {
    make_name(this)

    console.log('make_name    ', make_name(this))
    console.log('make_basename', make_name(this))
  })

function make_name(seneca) {
  let start = Date.now()
  let count = 0
  while (Date.now() - start < dur) {
    seneca.make$('foo')
    count++
  }
  return count
}

function make_basename(seneca) {
  let start = Date.now()
  let count = 0
  while (Date.now() - start < dur) {
    seneca.make$('foo/bar')
    count++
  }
  return count
}
