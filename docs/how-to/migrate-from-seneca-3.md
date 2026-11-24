# Migrate from Seneca 3

How to move code that uses entities from Seneca 3 to Seneca 4. The
general Seneca changes are in the Seneca documentation
([Migrate from Seneca 3](https://github.com/senecajs/seneca/blob/master/docs/how-to/migrate-from-seneca-3.md));
this page covers what affects entity code. The background is in
[Seneca 3 and Seneca 4](../explanation/seneca-3-and-4.md).

## 1. Update the packages

Seneca 4 requires Node.js 24 or later. Use version 29.0.0 or later of
this plugin, published as `@seneca/entity`. Versions up to 28.1.0 were
published as `seneca-entity`; 28.1.0 does not load on Seneca 4.
Applications that stay on Seneca 3 keep seneca-entity 28: version 29
requires Seneca 4 (peer dependency `seneca` `^4.0.0`).

```sh
npm uninstall seneca-entity seneca-mem-store seneca-promisify
npm install seneca@^4 @seneca/entity
```

The default store comes with the plugin as `@seneca/mem-store` 10.
Versions of the store up to 9.4.0 were published as
`seneca-mem-store`, and 9.4.0 does not load on Seneca 4.0.0 either; if
you install the store yourself, install `@seneca/mem-store`.

Load the plugin by package or by full name,
`seneca.use(require('@seneca/entity'))` or `seneca.use('@seneca/entity')`,
and the store, when you load it yourself, as
`seneca.use('@seneca/mem-store')`. Plugins that declare a peer
dependency on `seneca-entity`, such as seneca-transport 8.3,
@seneca/user 6.4, @seneca/owner 6.4 and seneca-msg-test 4.1, make npm
install seneca-entity 28.1.0 (and with it seneca-mem-store 9.4.0) next
to the new packages, and the short names `entity` and `mem-store` can
load the old packages. The instance then stops at startup with
`plugin_gubu_shape`. Move such plugins to their Seneca 4 versions. See
[Seneca 3 and Seneca 4: package names](../explanation/seneca-3-and-4.md#package-names).

## 2. Load a transport where entities cross processes

Seneca 4 has no network transport of its own. Where a service exposes
or calls entity actions over the network, install and load
`@seneca/transport` (not the Seneca 3 package `seneca-transport`), and
pin `sys:entity`:

```js
seneca.use('@seneca/transport').listen({ type: 'web', port: 8270, pin: 'sys:entity' })
```

See [Share entities over a transport](share-entities-over-a-transport.md).

## 3. Drop seneca-promisify

Entity promises (`await seneca.entity('foo').save$()`) never needed
seneca-promisify. `seneca.post`, `seneca.message`, `await seneca.ready()`
and `await seneca.close()` are built into Seneca 4. Remove
`seneca.use('promisify')` and the seneca-promisify dependency; on
Seneca 4 loading it prints the deprecation warning
`SENECA_DEP_PROMISIFY`.

## 4. Read error messages directly

Errors from stores and priors are no longer wrapped. On Seneca 3 the
caller received `seneca: Action cmd:save,sys:entity failed: <message>.`
with the original error as `err.orig`. On Seneca 4 the caller receives
the original error:

```js
try {
  await seneca.entity('person').save$()
} catch (err) {
  console.log(err.message)   // the store's message
}
```

Replace `err.orig` with `err`. Validation errors from `save$` and
`valid$` were never wrapped. They keep their message and `props`, but
are a `ShapeError` on Seneca 4 (see step 6).

## 5. Check how options are given

Seneca 4 reads plugin options only from `seneca.use(plugin, options)`
and from the `plugin` instance option:

```js
Seneca({ plugin: { entity: { strict: true }, 'mem-store': { merge: false } } })
```

The instance option `default_plugins` controls neither the entity plugin
nor its store; use the plugin's `mem_store` option.

## 6. Build validation shapes with `seneca.valid`

Seneca 4 validates with shape, the renamed successor of Gubu; Seneca
3.38 validated with Gubu 9. The plugin builds the `ent.<canon>.valid`
and `valid_json` shapes with the validator of the running instance, so
write them with plain types and the builders of `Seneca.valid` (or
`seneca.valid`):

```js
const Valid = Seneca.valid

seneca.use('@seneca/entity', {
  ent: { '-/-/person': { valid: Valid({ id: String, name: String, nick: Valid.Skip(String) }) } },
})
```

* Replace `Seneca.util.Gubu` with `Seneca.valid`. On Seneca 4
  `Seneca.util.Gubu` is a deprecated alias of shape (deprecation code
  `SENECA_DEP_UTIL_GUBU`); Seneca 5 removes it.
* Do not put builders imported from the gubu package
  (`const { Required } = require('gubu')`) in a specification: the
  plugin refuses it when it loads, and the instance stops with
  `plugin_define_failed` (see
  [Errors](../reference/errors.md#raised-when-a-plugin-loads)).
  Builders imported from the shape package work. Shapes already built
  with `Gubu(...)` from the gubu package are used as they are and keep
  working.
* A failed validation throws a `ShapeError` (`shape: true`), where
  Seneca 3 threw a `GubuError` (`gubu: true`). Code that checks
  `err.gubu` or `err.name` should check `err.code`, which is `'shape'`
  for both.

## 7. Keep or rename `role:entity` patterns

The plugin translates `role:entity,cmd:save|load|list|remove` to
`sys:entity`, in messages and in patterns you add. Old priors keep
working. New code should use `sys:entity`.

## 8. Check store plugins

Stores built on the entity plugin's initializer (`entity/init`) close
correctly: their `close` command is attached to `sys:seneca,cmd:close`.
A store that adds its own close hook on the Seneca 3 pattern
`role:seneca,cmd:close` still closes on Seneca 4, but the hook is
deprecated (`SENECA_DEP_LEGACY_CLOSE_HOOK`; Seneca 5 removes it).
Release resources with `this.destroy(fn)` in the plugin definition
instead:

```js
function my_store(options) {
  const client = connect(options)   // your database client
  this.destroy(async function () {
    await client.end()
  })
}
```

A store whose option `defaults` are built with builders from the gubu
package does not load on Seneca 4 (`plugin_gubu_shape`). Write
`defaults` as a plain object, or as a function of `{ valid }` that
builds the shape with the builders Seneca passes in, as this plugin and
@seneca/mem-store 10 do:

```js
my_store.defaults = ({ valid }) => ({ map: {}, url: valid.Skip(String) })
```

Run the store's tests with @seneca/store-test on Seneca 4
([Test a store plugin](test-a-store-plugin-with-store-test.md)).

## 9. Run the tests

Run the application's tests on Seneca 4 and look for entity calls
whose results are awaited although the entity is in callback mode
(results of `seneca.act` and `seneca.post` on `sys:entity` patterns,
and entities made with `seneca.make$`): see
[Use entities with promises](use-promises-and-async-actions.md#4-convert-callback-mode-entities-before-awaiting).
This is not a Seneca 4 change, but moving to promises tends to expose it.
