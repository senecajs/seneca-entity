# Migrate from Seneca 3

How to move code that uses entities from Seneca 3 to Seneca 4. The
general Seneca changes are in the Seneca documentation
([Migrate from Seneca 3](https://github.com/senecajs/seneca/blob/master/docs/how-to/migrate-from-seneca-3.md));
this page covers what affects entity code. The background is in
[Seneca 3 and Seneca 4](../explanation/seneca-3-and-4.md).

## 1. Update the packages

Seneca 4 needs Node.js 22 or later. Use version 29.0.0 or later of
this plugin, published as `@seneca/entity`. Versions up to 28.1.0 were
published as `seneca-entity`; 28.1.0 does not load on Seneca 4.0.0.

```sh
npm install seneca@^4.0.0-rc5 @seneca/entity
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
to the new packages, and the short names `entity` and `mem-store` find
the old packages first. On Seneca 4.0.0 the instance then stops at
startup with `plugin_gubu_shape`. See
[Seneca 3 and Seneca 4: package names](../explanation/seneca-3-and-4.md#package-names).

The plugin also works on Seneca 3 from 3.38 (earlier 3.x versions are
no longer supported), so the update can be done before moving to
Seneca 4.

## 2. Load a transport where entities cross processes

Seneca 4 has no network transport of its own. Where a service exposes
or calls entity actions over the network, install and load
seneca-transport, and pin `sys:entity`:

```js
seneca.use('seneca-transport').listen({ type: 'web', port: 8270, pin: 'sys:entity' })
```

See [Share entities over a transport](share-entities-over-a-transport.md).

## 3. Drop seneca-promisify unless Seneca 3 is still supported

Entity promises (`await seneca.entity('foo').save$()`) never needed
seneca-promisify. `seneca.post`, `seneca.message`, `await seneca.ready()`
and `await seneca.close()` are built into Seneca 4. Keep
seneca-promisify only where the same code must also run on Seneca 3; on
Seneca 4 it does nothing.

On 4.0.0-rc5, use `await new Promise((resolve) => seneca.ready(resolve))`
instead of `await seneca.ready()` on an instance that may already be
idle.

## 4. Read error messages directly

Errors from stores and priors are no longer wrapped. On Seneca 3 the
caller received `seneca: Action cmd:save,sys:entity failed: <message>.`
with the original error as `err.orig`. On Seneca 4 the caller receives
the original error:

```js
try {
  await seneca.entity('person').save$()
} catch (err) {
  console.log(err.message)               // Seneca 4: the store's message
  console.log((err.orig || err).message) // both versions
}
```

Validation errors from `save$` and `valid$` are not wrapped on either
version. They have the same message and `props` on both, but are a
`ShapeError` on Seneca 4.0.0 (see step 6).

## 5. Check how options are given

Seneca 4 reads plugin options only from `seneca.use(plugin, options)`
and from the `plugin` instance option:

```js
Seneca({ plugin: { entity: { strict: true }, 'mem-store': { merge: false } } })
```

The instance option `default_plugins` controls neither the entity plugin
nor its store on any version; use the plugin's `mem_store` option.

## 6. Build validation shapes with `seneca.valid`

Seneca 4.0.0 validates with shape, the renamed successor of Gubu;
Seneca 3.38 and 4.0.0-rc5 validate with Gubu 9. The plugin builds the
`ent.<canon>.valid` and `valid_json` shapes with the validator of the
running instance, so write them with plain types and the builders of
`Seneca.valid` (or `seneca.valid`), which work on every version:

```js
const Valid = Seneca.valid

seneca.use('@seneca/entity', {
  ent: { '-/-/person': { valid: Valid({ id: String, name: String, nick: Valid.Skip(String) }) } },
})
```

* Replace `Seneca.util.Gubu` with `Seneca.valid`. On Seneca 4.0.0
  `Seneca.util.Gubu` is a deprecated alias of shape (deprecation code
  `SENECA_DEP_UTIL_GUBU`); Seneca 5 removes it.
* On Seneca 4.0.0, do not put builders imported from the gubu package
  (`const { Required } = require('gubu')`) in a specification: the
  plugin refuses it when it loads, and the instance stops with
  `plugin_define_failed` (see
  [Errors](../reference/errors.md#raised-when-a-plugin-loads)).
  Builders imported from the shape package work. Shapes already built
  with `Gubu(...)` from the gubu package are used as they are and keep
  working.
* A failed validation throws a `ShapeError` (`shape: true`) on Seneca
  4.0.0 and a `GubuError` (`gubu: true`) on Seneca 3.38 and 4.0.0-rc5.
  Code that checks `err.gubu` or `err.name` should check `err.code`,
  which is `'shape'` on both.

With 28.1.0, the plugin does not load on Seneca 4.0.0 at all, and on
Seneca 3.38 and 4.0.0-rc5 a shape built with `Seneca.util.Gubu` made
every save fail with "the object is not of type function".

## 7. Keep or rename `role:entity` patterns

The plugin translates `role:entity,cmd:save|load|list|remove` to
`sys:entity`, in messages and in patterns you add, on both versions. Old
priors keep working. New code should use `sys:entity`.

## 8. Check store plugins

Stores built on the entity plugin's initializer (`entity/init`) close
correctly on both versions: their `close` command is attached to
`sys:seneca,cmd:close`, which Seneca 3 translates to its own close
pattern. A store that adds its own close hook on `role:seneca,cmd:close`
is not closed by Seneca 4.0.0-rc5 (4.0.0 calls such hooks for
compatibility). Register the hook on the pattern of the running version:

```js
const close_pattern = seneca.version.startsWith('3.')
  ? 'role:seneca,cmd:close' : 'sys:seneca,cmd:close'
```

A store whose option `defaults` are built with builders from the gubu
package does not load on Seneca 4.0.0 (`plugin_gubu_shape`). Write
`defaults` as a plain object, or as a function of `{ valid }` that
builds the shape with the builders Seneca passes in, as this plugin and
@seneca/mem-store 10 do:

```js
my_store.defaults = ({ valid }) => ({ map: {}, url: valid.Skip(String) })
```

Run the store's tests with seneca-store-test on Seneca 4
([Test a store plugin](test-a-store-plugin-with-store-test.md)).

## 9. Run the tests

Run the application's tests on Seneca 4 and look for entity calls
whose results are awaited although the entity is in callback mode
(results of `seneca.act` and `seneca.post` on `sys:entity` patterns,
and entities made with `seneca.make$`): see
[Use entities with promises](use-promises-and-async-actions.md#4-convert-callback-mode-entities-before-awaiting).
This is not a Seneca 4 change, but moving to promises tends to expose it.
