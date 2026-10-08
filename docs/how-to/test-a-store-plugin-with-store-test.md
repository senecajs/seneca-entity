# Test a store plugin with seneca-store-test

How to run the standard store test suites,
[seneca-store-test](https://github.com/senecajs/seneca-store-test),
against your own store plugin. The official stores use the same suites.
The commands below were run against the store from
[Writing a store plugin](../tutorials/writing-a-store-plugin.md)
(76 tests).

## 1. Install the test dependencies

```sh
npm install --save-dev seneca @seneca/entity seneca-store-test @hapi/lab @hapi/code
```

seneca-store-test requires `@hapi/lab` and `@hapi/code` at runtime but
does not declare them as dependencies, so install them yourself. The
suites are written for lab and need a lab script; they do not run
under the Node.js test runner.

## 2. Write the test file

Create `test/store.test.js` in the store's repository:

```js
const Lab = require('@hapi/lab')
const Seneca = require('seneca')
const StoreTest = require('seneca-store-test')

const lab = (exports.lab = Lab.script())

function makeSeneca() {
  return Seneca({ log: 'silent' })
    .test()
    .use('entity', { mem_store: false }) // no default store: test yours alone
    .use('..')                           // the store plugin, from the repository root
}

StoreTest.test.init(lab, {
  seneca: Seneca({ log: 'silent' }).test().use('entity', { mem_store: false }),
  name: 'map-store', // the plugin name of your store
})
StoreTest.test.keyvalue(lab, { seneca: makeSeneca() })
StoreTest.basictest({ seneca: makeSeneca(), script: lab })
StoreTest.sorttest({ seneca: makeSeneca(), script: lab })
StoreTest.limitstest({ seneca: makeSeneca(), script: lab })
```

Give each suite its own instance: the suites clear and create data in
the same entity kinds (`foo`, `zen/moon/bar` and others).

## 3. Choose the suites your store supports

| Suite | Settings | Tests |
| ----- | -------- | ----- |
| `test.init(lab, opts)` | `seneca`, `name`, `options` | Loads the plugin with `seneca.use('..', options)` and checks it is registered; clears the `test0` kind. |
| `test.keyvalue(lab, opts)` | `seneca`, `ent0` (default `'test0'`) | Save and load with generated and given ids, updates, idempotent removes. |
| `basictest(settings)` | `seneca`, `script` | Load, save, list and remove: filtering, generated and given ids (`id$`), attribute types, `null` values, lists by id or array of ids, `all$` and `load$` on remove, reloading and removing the entity itself, `native$`, and copies (saved data must not share objects with the caller's entity). |
| `sorttest(settings)` | `seneca`, `script` | `sort$` in `list$` and `remove$`. |
| `limitstest(settings)` | `seneca`, `script` | `limit$` and `skip$`, with and without `sort$`, invalid values ignored. |
| `upserttest(settings)` | `seneca`, `script` | `upsert$`. |
| `mergetest(settings)` | `senecaMergeFalse`, `script` | Store loaded with the option `merge: false`: updates replace instead of merging. |
| `sqltest(settings)` | `seneca`, `script` | Native SQL queries, for SQL stores. |
| `extended` | | Extended SQL support, for SQL stores. |

The `script` setting is the lab script; a suite creates its own when it
is missing, which lab does not run, so always pass it.

## 4. Run the tests

```sh
npx lab -v -t 0 test/store.test.js
```

`-t 0` turns off lab's coverage threshold. Add `"test": "lab -v -t 0 test"`
to `package.json` to run it with `npm test`.

## 5. Read failures

Failures name the suite and the case, for example
`Basic Tests Save should not save modifications to entity after save completes`.
That one means the store keeps a reference to the caller's data: copy
the data on save and on read (`seneca.util.deep`). The case names
describe the expected behaviour; the
[Store protocol](../reference/store-protocol.md) and
[Query directives](../reference/query-directives.md) pages describe the
messages the suites send.
