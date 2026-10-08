# Migrate from Seneca 3

How to move code that uses entities from Seneca 3 to Seneca 4. The
general Seneca changes are in the Seneca documentation
([Migrate from Seneca 3](https://github.com/senecajs/seneca/blob/master/docs/how-to/migrate-from-seneca-3.md));
this page covers what affects entity code. The background is in
[Seneca 3 and Seneca 4](../explanation/seneca-3-and-4.md).

## 1. Update the packages

Seneca 4 needs Node.js 22 or later. Use version 28.2.0 or later of
this plugin. From 28.2.0 the package name is `@seneca/entity`; versions
up to 28.1.0 were published as `seneca-entity`.

```sh
npm install seneca@^4.0.0-rc5 @seneca/entity
```

`seneca.use('entity')` finds the plugin under either package name.
The plugin still works on Seneca 3.x, so the update can be done before
moving to Seneca 4.

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

Validation errors from `save$` and `valid$` are thrown by the plugin
and are the same on both versions.

## 5. Check how options are given

Seneca 4 reads plugin options only from `seneca.use(plugin, options)`
and from the `plugin` instance option:

```js
Seneca({ plugin: { entity: { strict: true }, 'mem-store': { merge: false } } })
```

The instance option `default_plugins` controls neither the entity plugin
nor its store on any version; use the plugin's `mem_store` option.

## 6. Use shapes from Seneca's Gubu freely

`Seneca.util.Gubu` and `seneca.valid` are Gubu 9 on Seneca 4 (Gubu 8 on
Seneca 3). Since 28.2.0 the `ent.<canon>.valid` option accepts shapes
from either copy. With 28.1.0, a shape built with `Seneca.util.Gubu` on
Seneca 4 made every save fail with "the object is not of type function".

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

Run the store's tests with seneca-store-test on Seneca 4
([Test a store plugin](test-a-store-plugin-with-store-test.md)).

## 9. Run the tests

Run the application's tests on Seneca 4 and look for entity calls
whose results are awaited although the entity is in callback mode
(results of `seneca.act` and `seneca.post` on `sys:entity` patterns,
and entities made with `seneca.make$`): see
[Use entities with promises](use-promises-and-async-actions.md#4-convert-callback-mode-entities-before-awaiting).
This is not a Seneca 4 change, but moving to promises tends to expose it.
