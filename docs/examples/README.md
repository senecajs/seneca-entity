# Examples

Runnable programs that accompany the [tutorials](../tutorials/) and
[how-to guides](../how-to/). Each file loads the plugin from this
repository (`require('../../..')`, which is the package's `dist/` build);
in your own project use `require('@seneca/entity')` or
`seneca.use('entity')` instead.

| Directory | Page |
| --------- | ---- |
| `getting-started/` | [Getting started with entities](../tutorials/getting-started.md) |
| `store-plugin/` | [Writing a store plugin](../tutorials/writing-a-store-plugin.md) (`map-store.test.js` runs with the Node.js test runner) |
| `how-to/query-sort-page.js` | [Query, sort and page](../how-to/query-sort-and-page.md) |
| `how-to/validate.js` | [Validate entity data](../how-to/validate-entity-data.md) |
| `how-to/promises-async-actions.js` | [Use entities with promises and in async actions](../how-to/use-promises-and-async-actions.md) |
| `how-to/transport.js` | [Share entities over a transport](../how-to/share-entities-over-a-transport.md) (needs `seneca-transport`, a development dependency of this repository; uses port 8270) |
| `how-to/default-store.js` | [Configure the default store](../how-to/configure-the-default-store.md) |
| `how-to/priors.js` | [Customize operations with priors](../how-to/customize-operations-with-priors.md) |

Run them from the repository root after `npm install` and `npm run build`,
with Node.js 22 or later, for example:

```sh
node docs/examples/getting-started/01-save-and-load.js
node docs/examples/store-plugin/map-store.test.js
```
