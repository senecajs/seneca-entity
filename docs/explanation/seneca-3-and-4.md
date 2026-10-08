# Seneca 3 and Seneca 4

The entity plugin works on Seneca 3.x and on Seneca 4 (from the
4.0.0-rc5 prerelease). This page lists what differs between the two
for entity code, and what the plugin does about it. The general
migration steps are in the Seneca 4 documentation and in
[Migrate from Seneca 3](../how-to/migrate-from-seneca-3.md).

## What is the same

The entity API itself: `seneca.entity`, `seneca.make$`, the entity
methods, the `sys:entity` patterns and their `role:entity`
translations, the store protocol, seneca-mem-store as the default
store, and the options. The test suite of this plugin passes unchanged
on Seneca 3.38, 4.0.0-rc5 and the unreleased 4.0.0.

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

## Validation shapes and Gubu versions

Seneca 4 bundles Gubu 9 as `Seneca.util.Gubu` (and `seneca.valid`);
Seneca 3.38 bundles Gubu 8. The plugin has its own Gubu dependency
(version 9 since 28.2.0). A shape built by one copy of Gubu cannot be
re-wrapped by another, so the plugin detects prepared shapes and uses
them as they are; a plain specification object or a function returning
one is wrapped by the plugin's Gubu. Before 28.2.0, a shape built by
another copy of Gubu, such as `Seneca.util.Gubu` on Seneca 4, failed
every save with "the object is not of type function". The plugin's
option shape (its `defaults`) is validated by the core's Gubu copy,
which works across versions.

## Errors

On Seneca 3, an error thrown or replied by a store (or a prior) reaches
the entity callback or promise wrapped: `err.message` is
`seneca: Action cmd:save,sys:entity failed: <original message>.` and
`err.orig` holds the original error. On Seneca 4 (`legacy.error` off by
default) the original error arrives unchanged, and the wrapper is
available as `err.meta$.err`. Code that inspects messages should use
`(err.orig || err).message` to run on both.

Validation errors thrown by `save$` and `valid$` are the plugin's own
and are identical on both versions.

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
Seneca 4 itself requires Node.js 22 or later.

## Dependencies

Seneca 4 no longer depends on `optioner`, `joi`, `norma` or `lodash`.
The entity plugin uses none of them. It declares its own dependencies
on `gubu`, `patrun` and `seneca-mem-store`; `patrun` was previously
resolved through Seneca's dependency tree and is declared explicitly
since 28.2.0.
