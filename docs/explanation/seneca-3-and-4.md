# Seneca 3 and Seneca 4

The entity plugin works on Seneca 4 (4.0.0, and the 4.0.0-rc5
prerelease) and on Seneca 3 from 3.38. This page lists what differs
between the two for entity code, and what the plugin does about it.
The general migration steps are in the Seneca 4 documentation and in
[Migrate from Seneca 3](../how-to/migrate-from-seneca-3.md).

## What is the same

The entity API itself: `seneca.entity`, `seneca.make$`, the entity
methods, the `sys:entity` patterns and their `role:entity`
translations, the store protocol, @seneca/mem-store as the default
store, and the options. The test suite of this plugin passes on Seneca
4.0.0, 4.0.0-rc5 and 3.38.0.

## Promises

Seneca 4 has promises built in (`seneca.post`, `seneca.message`,
`await seneca.ready()`, `await seneca.close()`). The entity plugin's
promise mode (`seneca.entity`) never depended on seneca-promisify: it
wraps `seneca.act` itself, so it works on Seneca 3 without the plugin
too. seneca-promisify is only needed on Seneca 3 for `seneca.post` and
`seneca.message` around your entity code; on Seneca 4 it is a no-op.

In 4.0.0-rc5, `await seneca.ready()` does not resolve on an instance
that is already idle (fixed in 4.0.0). The callback form
`await new Promise((resolve) => seneca.ready(resolve))` works on every
version, which is why the examples in this documentation use it.

## Validation: shape and Gubu

Seneca validates with a library it bundles and exposes as
`Seneca.valid` and `seneca.valid`: [shape](https://github.com/rjrodger/shape)
11 on Seneca 4.0.0, [Gubu](https://github.com/rjrodger/gubu) 9 on
Seneca 4.0.0-rc5 and on Seneca 3.38 (which bundles Gubu 9.0.0). shape
is the renamed successor of Gubu. The builders (`Open`, `Required`,
`Skip`, ...), the JSON form and the error messages are the same, but
neither library reads the other's builder nodes, and Seneca 4.0.0
rejects plugin option defaults built with Gubu (fatal
`plugin_gubu_shape`).

Since 29.0.0 the plugin has no validation library of its own; it uses
the one of the Seneca instance:

* Its option shape is built by its `defaults` function from the
  builders Seneca passes in (`defaults({ valid })`). seneca-entity
  28.1.0 built its defaults with its own copy of Gubu 8, which is why
  it does not load on Seneca 4.0.0.
* The entity shapes of the `ent` option are built with
  `seneca.valid(spec, { name })` (for `valid`) and
  `seneca.valid.build(json, { name })` (for `valid_json`). A
  specification written with plain types (`String`, `Number`) and the
  builders of `seneca.valid` therefore works on every version, and so
  does a `valid_json` shape.
* A prepared shape, recognized by its `shape` or `gubu` marker
  property, is used as it is, whichever copy or version of either
  library built it: a shape cannot be wrapped again by another copy.
  Up to 28.1.0 the plugin wrapped shapes it did not recognize with its
  own Gubu, and every save then failed with "the object is not of type
  function"; on Seneca 3.38 and 4.0.0-rc5 that happened to shapes built
  with `Seneca.util.Gubu` (Gubu 9).
* A specification that holds builder nodes of the other library is
  refused when the plugin loads: Gubu builders (for example `Required`
  imported from the gubu package) on Seneca 4.0.0, shape builders on
  Seneca 3.38 and 4.0.0-rc5. The validator would not read them, and
  every save would fail with "...is not of type object". Instead the
  plugin definition throws an error that names the canon and the path,
  and Seneca stops with `plugin_define_failed` (see
  [Errors](../reference/errors.md#raised-when-a-plugin-loads)).

`Seneca.util.Gubu` is a deprecated alias of shape on Seneca 4.0.0
(deprecation code `SENECA_DEP_UTIL_GUBU`; Seneca 5 removes it), and
Gubu 9 on Seneca 3.38 and 4.0.0-rc5. Write `Seneca.valid` or
`seneca.valid`, which is the validator of the running version on every
version.

## Errors

On Seneca 3, an error thrown or replied by a store (or a prior) reaches
the entity callback or promise wrapped: `err.message` is
`seneca: Action cmd:save,sys:entity failed: <original message>.` and
`err.orig` holds the original error. On Seneca 4 (`legacy.error` off by
default) the original error arrives unchanged, and the wrapper is
available as `err.meta$.err`. Code that inspects messages should use
`(err.orig || err).message` to run on both.

Validation errors thrown by `save$` and `valid$` are not wrapped on
either version. They come from the validator: a `ShapeError`
(`shape: true`) on Seneca 4.0.0, a `GubuError` (`gubu: true`) on
Seneca 3.38 and 4.0.0-rc5. The message, `code` (`'shape'`), `gname`
and `props` are the same, so code that runs on both should test
`err.code` or read `err.props` rather than the error name. The
descriptions returned by `valid$({ errors: true })` have an extra
`pathArr` property on Seneca 4.0.0. A prepared shape throws the error
of the library that built it.

## Closing stores

Stores release their resources through a prior on
`sys:seneca,cmd:close`, which the entity plugin registers for each
store's `close` command. Seneca 4 closes through that pattern. Seneca 3
closes through `role:seneca,cmd:close` and translates `sys:seneca`
patterns to it, so the same registration works on both. Seneca 4.0.0
(final) also calls hooks that were registered on the Seneca 3 pattern.

## Transports

Seneca 3 had an HTTP transport built in; Seneca 4 does not. To share
entities between processes on Seneca 4, load seneca-transport on both
sides. The conversion of `entity$` data into entities on arrival
(`handle_entity` in the core transport utilities) exists in both
versions, and so do the details described in
[Share entities over a transport](../how-to/share-entities-over-a-transport.md):
pin `sys:entity` rather than `sys:entity,cmd:*`, turn off the client's
own store, and rebuild replies in promise mode before awaiting their
methods.

One difference is specific to 4.0.0-rc5: seneca-transport 8.3.0 closes
its listeners in a `role:seneca,cmd:close` hook, which rc5 does not
call, so a process with a listener does not exit after `close()`.
Seneca 3 and Seneca 4.0.0 call the hook.

## Options

Seneca 4 reads plugin options only from `seneca.use(plugin, options)`
and from `plugin.entity` in the instance options, and validates them
strictly against the plugin's `defaults`. Seneca 3 could also merge a
top level `entity` key when `legacy.top_plugins` was on; it is off by
default in 3.38. The `default_plugins` instance option, which Seneca 3
used to control built in plugins, is accepted but not read by Seneca 4.

## Node.js

The plugin requires Node.js 18 or later and is tested on 22 and 24.
Seneca 4.0.0 itself requires Node.js 24 or later.

## Package names

The plugin is published as `@seneca/entity` from 29.0.0 (up to 28.1.0
as `seneca-entity`), and its default store as `@seneca/mem-store` from
10.0.0 (up to 9.4.0 as `seneca-mem-store`). The last versions under the
old names, seneca-entity 28.1.0 and seneca-mem-store 9.4.0, do not load
on Seneca 4.0.0 (`plugin_gubu_shape`). Plugins that still declare
a peer dependency on `seneca-entity`, such as seneca-transport 8.3
(which Seneca 3.38 depends on), @seneca/user 6.4, @seneca/owner 6.4 and
seneca-msg-test 4.1, make npm install seneca-entity 28.1.0, and with it
seneca-mem-store 9.4.0, next to the new packages.

Seneca looks up a plugin name by trying `seneca-<name>`, then
`@seneca/<name>`, then `<name>`. Where both packages are installed,
`seneca.use('entity')` therefore loads seneca-entity 28.1.0 and
`seneca.use('mem-store')` loads seneca-mem-store 9.4.0: Seneca 4.0.0
stops at startup, and Seneca 3.38 and 4.0.0-rc5 run the old versions.
Loading the plugins by package (`require('@seneca/entity')`) or by
full name (`seneca.use('@seneca/entity')`,
`seneca.use('@seneca/mem-store')`) works on every version. Either way
the plugins register under their short names, `entity` and
`mem-store`, so options given under `plugin.entity` and
`plugin['mem-store']` still apply.

## Dependencies

Seneca 4 no longer depends on `optioner`, `joi`, `norma` or `lodash`;
the entity plugin uses none of them. Seneca 4.0.0 depends on shape
instead of Gubu, and the plugin uses whichever validator the instance
has, so since 29.0.0 it has no `gubu` dependency. Its dependencies are
`patrun` (declared since 29.0.0; earlier versions resolved it through
Seneca's dependency tree) and `@seneca/mem-store` ^10.0.0, the default
store.
