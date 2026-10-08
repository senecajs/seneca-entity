# Customize operations with priors

How to add behaviour to entity operations (defaults, checks, filtering,
auditing) without changing the store, by adding your own actions for
the entity patterns. The complete program is
[docs/examples/how-to/priors.js](../examples/how-to/priors.js).

An action added for a pattern that already has one becomes the current
handler, and the earlier action becomes its *prior*: `this.prior(msg)`
passes the message on, eventually to the store. A more specific pattern
(`sys:entity,cmd:save,name:person`) is tried before a general one
(`sys:entity,cmd:save`).

## 1. Change every save

```js
seneca.message('sys:entity,cmd:save', async function (msg) {
  msg.ent.saved_at = new Date().toISOString()
  return this.prior(msg)
})
```

`msg.ent` is the entity being saved. Add the action after the store is
loaded (after `seneca.ready`). An action added before the store loads
becomes the store's prior instead, and since a store does not call its
prior, the action never runs.

## 2. Check one kind

Add the canon parts to the pattern to restrict it:

```js
seneca.message('sys:entity,cmd:save,name:person', async function (msg) {
  if (null == msg.ent.name) {
    throw new Error('a person needs a name')
  }
  return this.prior(msg)
})
```

The caller's `save$` rejects with this error (on Seneca 4 with the
original message). Use `base:` and `zone:` in the pattern for whole
groups of kinds.

## 3. Change results

Wait for the prior, then change what it returns:

```js
seneca.message('sys:entity,cmd:list,name:person', async function (msg) {
  const list = await this.prior(msg)
  for (const person of list) {
    delete person.secret
  }
  return list
})
```

For `load`, `list` and `remove`, `msg.q` is the query and `msg.qent` a
template entity of the queried kind; a prior can change `msg.q` before
calling `this.prior(msg)` (for example to add a tenant condition).

## 4. Pass hints for one operation

Two entity level directives carry data from the caller to the actions
without storing it:

```js
seneca.message('sys:entity,cmd:save,name:person', async function (msg) {
  if (msg.audit$) msg.ent.audit = msg.audit$                          // from directive$
  if (msg.ent.custom$.source) msg.ent.source = msg.ent.custom$.source // from custom$
  return this.prior(msg)
})

await Person.make$({ name: 'Alice', secret: 'x' })
  .directive$({ audit$: 'ticket-1' })   // copied to the top level of the message
  .custom$({ source: 'import' })        // available as msg.ent.custom$
  .save$()
```

Neither travels over a transport; see
[Share entities over a transport](share-entities-over-a-transport.md#6-know-what-travels).

## 5. Keep old `role:entity` priors

Actions added for `role:entity,cmd:save` (the Seneca 2 and 3 form) are
translated to `sys:entity,cmd:save` and join the same chain, so existing
plugins keep working next to new ones.

## The program's output

```
saved: {
  name: 'Alice',
  secret: 'x',
  audit: 'ticket-1',
  source: 'import',
  saved_at: 'T0',
  id: 'xb5re2'
}
rejected: a person needs a name
listed: [
  {
    name: 'Alice',
    audit: 'ticket-1',
    source: 'import',
    saved_at: 'T0',
    id: 'xb5re2'
  }
]
thing: { secret: 'z', saved_at: 'T0', id: 'hfyrip' }
```

The `saved_at` value is a fixed `'T0'` in the program to keep its
output stable. The kind `thing` gets the general save prior only.
