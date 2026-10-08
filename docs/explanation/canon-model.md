# The canon model

Every entity has a *canon*: the triple zone, base and name that says
what kind of thing it is. This page explains what the three parts are
for and how the plugin and the stores use them.

## Three parts, two of them optional

```
zone / base / name
```

* `name` is the kind of entity: `person`, `order`, `product`. It is the
  part you always have.
* `base` groups kinds, like a schema or a namespace of tables:
  `shop/product`, `shop/order`. Stores usually map base and name to
  their own structure (seneca-mem-store keeps `data[base][name][id]`;
  a SQL store might use `base` as the schema and `name` as the table).
* `zone` separates whole data sets that have the same shape: tenants,
  regions, environments. `eu/shop/order` and `us/shop/order` are
  different kinds of entity as far as routing is concerned.

A part that is not set is written `-` in the string form: `-/-/person`,
`-/shop/product`. The string form is what `ent.entity$` holds and what
the `ent` option and the store `map` option are keyed by. A leading `$`
is accepted when parsing (`$-/-/person`) and produced by
`canon$({ string$: true })`.

The parts are matched by the pattern `\w+` (letters, digits and `_`).
The parser does not reject other characters: it stops at the first
one, so `my-thing` becomes `-/-/my` and `a.b` becomes `-/-/a`. Use
`my_thing`. Only a string in which no part can be found at all (such as
`''` or `'?'`) throws `Entity: invalid entity canon`.

## Why not just a name

The canon exists for routing. Entity operations are messages
(`sys:entity,cmd:save,name:product,base:shop`), and Seneca routes
messages by pattern. Because `name`, `base` and `zone` are properties
of the message, a store can be registered for all entities, for a
base, for a zone or for one kind, simply by adding patterns with the
corresponding properties (see
[Configure the default store](../how-to/configure-the-default-store.md)).
Pattern specificity does the rest: the store registered for
`name:log` wins over the default store for `log` entities, and the
default store handles everything else.

The same mechanism serves business logic. A prior on
`sys:entity,cmd:save,name:person` runs for people only; a prior on
`sys:entity,cmd:save,zone:eu` runs for everything in the `eu` zone.

## Zone and storage

The zone is a routing concept. seneca-mem-store does not include it in
its storage key, so `eu/shop/order` and `us/shop/order` entities that
reach the same mem-store instance share a table. Multi-tenancy by zone
therefore means one store instance per zone (each mapped with
`map: { 'eu/-/-': '*' }`), or a store that reads the zone from
`ent.canon$({ object: true })` and uses it in its own key. Other stores
may behave differently; check the store's documentation before relying
on the zone for isolation.

## Where the canon comes from

`seneca.entity(name)`, `seneca.entity(base, name)` and
`seneca.entity(zone, base, name)` give the parts positionally. A props
object can give them as `entity$` (string or object) or as `zone$`,
`base$` and `name$`. `ent.make$()` without arguments keeps the parts of
the entity it is called on, and can override any of them. The parts
are fixed once the entity exists; `canon$({ change })` is deprecated.

`is$` and `canon$({ isa })` compare canons part by part; `-/-/person`
and `shop/-/person` are different kinds.

## Strict mode

By default any canon is allowed: typing `seneca.entity('persn')`
creates a new kind of entity. With option `strict: true` the canon must
be listed in the `ent` option, exactly or by a pattern with unset parts
(`sys/-/-` admits every kind in zone `sys`). Strict mode catches typos
at the point where the entity is created, which is usually closer to
the mistake than a failed query later on.
