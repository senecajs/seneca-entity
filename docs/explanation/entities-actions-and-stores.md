# How entity methods map to actions and stores

An entity method is a convenient way to send a message. This page
follows a `save$` call from the entity object to the store and back,
and explains what that design buys.

## The path of a save

```js
const alice = await seneca.entity('person').make$({ name: 'Alice' }).save$()
```

1. `save$` builds a message from the entity: `{ cmd: 'save', q: {}, sys: 'entity', ent, name: 'person' }`,
   where `ent` is the entity itself. The `sys:entity` part comes from
   the `pattern_fix` option; `name`, `base` and `zone` come from the
   canon; the entity's `directive$` entries are copied to the top
   level.
2. If the `ent` option has a validation shape for `-/-/person`, the
   entity data is checked and defaults are filled in. A failure is
   thrown here, before any message is sent.
3. The message is submitted with `seneca.act`. Seneca finds the most
   specific matching action: an action you added for the pattern, a
   store mapped to `name:person`, or the default store's
   `sys:entity,cmd:save`.
4. The store's `save` function receives the entity object, persists
   its fields and replies with `ent.make$(savedData)`.
5. Seneca's outward pipeline converts any result carrying `entity$`
   into an entity (`outward_res_entity`); the promise resolves with it.

The result is a new object. Whether the store also changes the entity
it received is up to the store: seneca-mem-store sets its `id`, the
store in the tutorial does not, and over a transport the caller's
object is never touched. Treat the result as the truth: a save is a
message, and the reply is what the store says is true now.

## Stores are plugins that add patterns

A store does not implement an interface the plugin calls directly. It
registers ordinary actions through the initializer exported by the
entity plugin, one pattern per command and canon
([Store protocol](../reference/store-protocol.md)). Everything that
works for actions therefore works for storage:

* **Routing by pattern.** The default store registers
  `sys:entity,cmd:save`; a store mapped to a canon registers
  `sys:entity,cmd:save,name:log`. The more specific pattern wins, so
  entity kinds can be spread over stores without the application code
  knowing.
* **Priors.** Adding your own action on `sys:entity,cmd:save` (or on
  `sys:entity,cmd:save,name:person`) puts your code in front of the
  store; `this.prior(msg)` passes control on. Validation, defaults,
  auditing, soft deletes and caching are all priors
  ([Customize operations with priors](../how-to/customize-operations-with-priors.md)).
* **Transports.** Because the message is plain data, a client can send
  it to another process, where the store lives
  ([Share entities over a transport](../how-to/share-entities-over-a-transport.md)).
* **Plain messages.** Code without entity objects can send
  `sys:entity,cmd:load,name:person,id:p1` and get an entity back.

## What travels in the message

Entities are JavaScript objects with a prototype, but a message must be
plain data when it crosses a process boundary. `JSON.stringify(ent)`
produces the fields plus `entity$` as a string, and that is exactly
what `seneca.make$(data)` needs to rebuild an entity on the other side.
Seneca's transport layer does this rebuilding for `msg.ent`, `msg.qent`
and for results, on the receiving side, when the entity plugin is
loaded there.

Consequences:

* Fields travel; `custom$` does not (it lives on the entity object, not
  in its JSON form). Directives in the query (`sort$`, `limit$`,
  `merge$` in `q`) do travel, because `q` is a plain object. A
  `directive$` entry copied to the top level of the message
  (`msg.audit$`) does not: the transport does not forward top level
  `$` properties.
* Values are JSON: a `Date` arrives as a string, functions and class
  instances are lost.
* Entities rebuilt on arrival are made with `seneca.make$`, so they are
  in callback mode.
* An error raised by the remote store arrives as an `Error`, but with
  seneca-transport 8.3.0 (`web` type) only as a generic
  `Response Error: 500 Internal Server Error`.

## Why not a real ORM

The entity API covers create, read, update, delete and simple queries.
It does not define relations, joins, transactions, migrations or a
query language, and it does not try to hide the store's own query
features (seneca-mem-store's `$gte` style constraints, for example, are
the store's, not the API's). The reason is the message model: what the
API guarantees is what every store can answer, and anything richer is
better expressed as a message of its own (`role:shop,cmd:report`) whose
implementation uses the store's native driver (`native$`) or a store
specific action. Denormalizing data to fit this model is often simpler
than mapping relations.

## Ids

A new entity has no `id`; the store assigns one on the first save. The
default generator (option `generate_id`, export `entity/generate_id`)
produces a random 6 character string, which stores without natural ids
use. The application can choose the id of a new entity with `id$`;
seneca-mem-store then fails with `entity-id-exists` if the id is taken.
An entity that has an `id` is saved under it: normally an update, and
with seneca-mem-store a new record if none has that id. Whether a store
checks for taken ids, and what it does with an unknown `id`, is up to
the store.

## Mode is a property of the entity

Whether a method returns a promise or takes a callback is decided when
the entity is created (`seneca.entity` versus `seneca.make$`) and
inherited by `make$`, not by the presence of a callback alone. This
keeps `seneca.make$` compatible with Seneca 2 and 3 code written in
callback style, where `ent.save$()` without a callback was a fire and
forget call, while `seneca.entity` gives the promise API without
changing the old behaviour.

The cost of this design is that the mode is invisible. Seneca core
rebuilds entities with `seneca.make$` (results of plain messages,
transport messages and replies), so those entities are in callback
mode, and awaiting their methods does not wait for the store. Making a
promise mode entity from the data (`seneca.entity(ent.data$())`) is the
way out; see
[Use entities with promises](../how-to/use-promises-and-async-actions.md#4-convert-callback-mode-entities-before-awaiting).
