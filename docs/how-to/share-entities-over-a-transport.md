# Share entities over a transport

How to keep the data in one service and use the entity API from
others, with [seneca-transport](https://github.com/senecajs/seneca-transport).
The complete program, which runs both sides in one process, is
[docs/examples/how-to/transport.js](../examples/how-to/transport.js).

## 1. Install the transport

Seneca 4 has no network transport of its own:

```sh
npm install seneca-transport
```

Seneca 3 includes seneca-transport and loads it by default; loading it
explicitly as below works there too.

## 2. Expose the entity messages from the service

The service has the entity plugin and a store, and listens for every
entity message:

```js
const service = Seneca({ tag: 'service' })
  .use('seneca-transport')
  .use('@seneca/entity')
  .listen({ type: 'web', port: 8270, pin: 'sys:entity' })
```

## 3. Send the entity messages from the client

The client has the entity plugin without a store, and a client for the
same pin:

```js
const client = Seneca({ tag: 'client' })
  .use('seneca-transport')
  .use('@seneca/entity', { mem_store: false })
  .client({ type: 'web', port: 8270, pin: 'sys:entity' })
```

Two details matter:

* `mem_store: false`. A local store registers `sys:entity,cmd:save`
  and the other commands, which are more specific than the
  `sys:entity` pin, so with a local store the messages never leave the
  client.
* `pin: 'sys:entity'`, not `'sys:entity,cmd:*'`. The entity plugin's
  compatibility patterns (`role:entity,cmd:save` and so on) use the
  same `cmd` values, and Seneca's pattern matching then prefers them
  over a `cmd:*` glob, so a glob pin matches no entity message.

## 4. Use the entity API as usual

```js
const saved = await client.entity('person').make$({ name: 'Alice' }).save$()
const people = await client.entity('person').list$({ sort$: { name: 1 } })
```

The messages and replies travel as JSON. The entity plugin on each side
rebuilds entity objects from the `entity$` marker, so the client
receives entities with their methods.

## 5. Convert replies before awaiting their methods

Entities rebuilt from a reply are in callback mode
([Use entities with promises](use-promises-and-async-actions.md#4-convert-callback-mode-entities-before-awaiting)).
`await saved.save$()` would not wait for the service. Make a promise
mode entity from the data first:

```js
const alice = client.entity(saved.data$())
alice.location = 'Wonderland'
await alice.save$()
```

## 6. Know what travels

| Item | Travels | Notes |
| ---- | ------- | ----- |
| Fields | yes | As JSON: a `Date` arrives as an ISO string; functions and class instances are lost. |
| `id`, canon | yes | `entity$` is part of the JSON form. |
| Query directives (`sort$`, `limit$`, `fields$`, `merge$` in the `save$` data, ...) | yes | They are part of the query object `q`. |
| `custom$` | no | It lives on the entity object, not in its JSON form. |
| `directive$` entries | no | They are copied to the top level of the message, and the transport does not forward top level `$` properties. |

## 7. Expect generic errors

An error raised in the service reaches the client as an `Error`. With
seneca-transport 8.3.0 and the `web` type, the client does not receive
the original message: it sees `Response Error: 500 Internal Server Error`
(on Seneca 3 wrapped as `seneca: Action sys:entity failed: Response Error: 500 Internal Server Error.`).
The original error is logged by the service.

## 8. Send only some kinds to the service

To keep a local store for most entities and send one kind to the
service, pin each command of that kind. These patterns are more
specific than the local store's:

```js
const pin = ['save', 'load', 'list', 'remove'].map((cmd) => 'sys:entity,cmd:' + cmd + ',name:person')

Seneca()
  .use('seneca-transport')
  .use('@seneca/entity')                 // local default store for other kinds
  .client({ type: 'web', port: 8270, pin })
```

A shorter pin such as `sys:entity,name:person` is not enough: the local
store's patterns win over it.

## 9. Close both sides

```js
await client.close()
await service.close()
```

seneca-transport 8.3.0 stops its HTTP listener in a
`role:seneca,cmd:close` hook. Seneca 3 and Seneca 4.0.0 call that hook
when closing; Seneca 4.0.0-rc5 does not, so the listener stays open and
the process does not exit. On rc5, run the hook before closing:

```js
if ('4.0.0-rc5' === service.version) {
  await service.post('role:seneca,cmd:close')
}
await service.close()
```

## The program's output

```
client saved: Entity {
  'entity$': '-/-/person',
  name: 'Alice',
  born: '1970-01-01T00:00:00.000Z',
  id: 'pucbdy'
}
client list:  [ 'Alice' ]
service has:  { name: 'Alice', born: '1970-01-01T00:00:00.000Z', id: 'pucbdy' }
service sees: Wonderland
remote error: Response Error: 500 Internal Server Error
```
