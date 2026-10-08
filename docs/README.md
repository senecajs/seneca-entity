# @seneca/entity documentation

The documentation follows the [Diátaxis](https://diataxis.fr/)
structure. Start with the tutorials if you are new to Seneca entities;
use the how-to guides for specific tasks; look things up in the
reference; read the explanations to understand the design.

## Tutorials

| Tutorial | What you build |
| -------- | -------------- |
| [Getting started with entities](tutorials/getting-started.md) | Save, load, query, update and remove data, with promises and callbacks. |
| [Writing a store plugin](tutorials/writing-a-store-plugin.md) | A complete store that passes the standard store tests. |

The programs from the tutorials and guides are in [examples](examples/).

## How-to guides

| Guide | Covers |
| ----- | ------ |
| [Query, sort and page](how-to/query-sort-and-page.md) | Field conditions, lists of ids, `sort$`, `skip$`, `limit$`, `fields$`, counting. |
| [Validate entity data](how-to/validate-entity-data.md) | Gubu shapes per entity kind, defaults, partial updates, `skip$`, `strict`. |
| [Use entities with promises and in async actions](how-to/use-promises-and-async-actions.md) | Promise mode, `this.entity`, errors, callback mode results, `meta$`. |
| [Share entities over a transport](how-to/share-entities-over-a-transport.md) | A data service and its clients with seneca-transport; what travels. |
| [Configure the default store](how-to/configure-the-default-store.md) | The in-memory store, replacing it, mapping kinds to stores. |
| [Customize operations with priors](how-to/customize-operations-with-priors.md) | Defaults, checks, result filtering and hints, without changing the store. |
| [Test a store plugin with seneca-store-test](how-to/test-a-store-plugin-with-store-test.md) | The standard store suites with lab. |
| [Migrate from Seneca 3](how-to/migrate-from-seneca-3.md) | What changes for entity code in Seneca 4. |

## Reference

| Reference | Describes |
| --------- | --------- |
| [Entity API](reference/entity-api.md) | Instance methods, modes, every entity method and property, the module. |
| [Query directives](reference/query-directives.md) | Query forms and every `$` directive. |
| [Messages](reference/messages.md) | Every action pattern, plain messages, translations, exports. |
| [Options](reference/options.md) | Every plugin option with its type, default and effect. |
| [Store protocol](reference/store-protocol.md) | The store initializer, commands, patterns and ids. |
| [Errors](reference/errors.md) | Every error the plugin, the default store and Seneca raise for entities. |

## Explanation

| Explanation | Topic |
| ----------- | ----- |
| [The canon model](explanation/canon-model.md) | Zone, base and name, and why entity kinds are routing keys. |
| [How entity methods map to actions and stores](explanation/entities-actions-and-stores.md) | From `save$` to the store and back; why stores are plugins; what travels; modes. |
| [Seneca 3 and Seneca 4](explanation/seneca-3-and-4.md) | What differs between the two for entity code. |

## Feature index

Every option, action pattern, export, decoration and error of the
plugin, built from the source (`src/entity.ts`, `src/lib/make_entity.ts`,
`src/lib/store.ts`, `src/valid.ts`), with the page that documents it.
The plugin has no command line interface.

### Options

| Option | Reference | Guides |
| ------ | --------- | ------ |
| `mem_store` | [Options](reference/options.md#options) | [Configure the default store](how-to/configure-the-default-store.md) |
| `generate_id` | [Options](reference/options.md#options), [Store protocol: ids](reference/store-protocol.md#ids) | [Writing a store plugin](tutorials/writing-a-store-plugin.md) |
| `pattern_fix` | [Options](reference/options.md#options), [Store protocol](reference/store-protocol.md#registered-patterns) | |
| `strict` | [Options](reference/options.md#options), [Errors](reference/errors.md#thrown-by-the-entity-api) | [Validate entity data](how-to/validate-entity-data.md#7-only-known-kinds) |
| `ent`, `ent.<canon>.valid`, `ent.<canon>.valid_json` | [Options](reference/options.md#options) | [Validate entity data](how-to/validate-entity-data.md) |
| `meta.provide` | [Options](reference/options.md#options), [Entity API: modes](reference/entity-api.md#modes-and-return-values) | |
| `log.active` | [Options](reference/options.md#options), [Entity API: data methods](reference/entity-api.md#data-methods) | |
| `jsonic.depth`, `jsonic.maxitems`, `jsonic.maxchars` | [Options](reference/options.md#options) | |
| `map` | [Options](reference/options.md#options) | |

### Action patterns

| Pattern | Reference | Guides |
| ------- | --------- | ------ |
| `sys:entity,cmd:save` | [Messages](reference/messages.md#entity-actions) | [Customize operations with priors](how-to/customize-operations-with-priors.md) |
| `sys:entity,cmd:load` | [Messages](reference/messages.md#entity-actions) | [Getting started](tutorials/getting-started.md) |
| `sys:entity,cmd:list` | [Messages](reference/messages.md#entity-actions) | [Query, sort and page](how-to/query-sort-and-page.md) |
| `sys:entity,cmd:remove` | [Messages](reference/messages.md#entity-actions) | [Getting started](tutorials/getting-started.md) |
| `sys:entity,cmd:native` | [Messages](reference/messages.md#entity-actions) | [Configure the default store](how-to/configure-the-default-store.md#5-check-the-routing) |
| `sys:entity,cmd:<command>` with `zone`, `base`, `name` (mapped stores) | [Store protocol: registered patterns](reference/store-protocol.md#registered-patterns) | [Configure the default store](how-to/configure-the-default-store.md#4-send-some-kinds-to-another-store) |
| `role:entity,cmd:save`, `load`, `list`, `remove` (translated to `sys:entity`) | [Messages: translations](reference/messages.md#translations) | [Customize operations with priors](how-to/customize-operations-with-priors.md#5-keep-old-roleentity-priors) |
| `sys:seneca,cmd:close` (store `close` command) | [Messages: close](reference/messages.md#close), [Store protocol](reference/store-protocol.md#registered-patterns) | [Writing a store plugin](tutorials/writing-a-store-plugin.md#6-native-access-and-closing) |
| `sys:entity,cmd:close` (sent by `close$`, not registered) | [Messages: close](reference/messages.md#close) | |
| `role:mem-store,cmd:dump`, `export`, `import` (default store) | [Messages: default store actions](reference/messages.md#default-store-actions) | |

### Decorations, exports and the module

| Feature | Reference | Guides |
| ------- | --------- | ------ |
| `seneca.entity` | [Entity API: instance methods](reference/entity-api.md#instance-methods) | [Use entities with promises](how-to/use-promises-and-async-actions.md) |
| `seneca.make$`, `seneca.make` | [Entity API: instance methods](reference/entity-api.md#instance-methods) | [Getting started](tutorials/getting-started.md#5-callbacks) |
| `seneca.util.parsecanon` | [Entity API: instance methods](reference/entity-api.md#instance-methods) | |
| `entity/init` | [Store protocol: the initializer](reference/store-protocol.md#the-initializer) | [Writing a store plugin](tutorials/writing-a-store-plugin.md) |
| `entity/store` (`cmds`, `init`) | [Store protocol: the initializer](reference/store-protocol.md#the-initializer) | |
| `entity/generate_id` | [Store protocol: ids](reference/store-protocol.md#ids) | [Writing a store plugin](tutorials/writing-a-store-plugin.md#3-save) |
| `Entity` (the entity class) | [Entity API: the Entity class](reference/entity-api.md#the-entity-class) | |
| Module export (plugin function, `defaults`, `preload`), TypeScript type `Entity` | [Entity API: the module](reference/entity-api.md#the-module) | |

### Entity methods and properties

| Feature | Reference |
| ------- | --------- |
| `save$`, `load$`, `list$`, `remove$`, `delete$`, `native$`, `close$` | [Entity API: store methods](reference/entity-api.md#store-methods) |
| Promise mode and callback mode | [Entity API: modes and return values](reference/entity-api.md#modes-and-return-values) |
| `make$` | [Entity API: instance methods](reference/entity-api.md#instance-methods) |
| `data$`, `fields$`, `clone$`, `is$`, `canon$`, `valid$`, `custom$`, `directive$`, `log$`, `toString`, inspection, JSON | [Entity API: data methods](reference/entity-api.md#data-methods) |
| `entity$`, `id`, `id$`, `merge$` and fields | [Entity API: properties](reference/entity-api.md#properties) |

### Directives

| Directive | Reference |
| --------- | --------- |
| Query forms (id, array of ids, object) | [Query directives: query forms](reference/query-directives.md#query-forms) |
| `sort$`, `skip$`, `limit$`, `fields$`, `all$`, `load$`, `meta$` | [Query directives: directives in queries](reference/query-directives.md#directives-in-queries) |
| `id$`, `merge$`, `upsert$`, `skip$` (validation) | [Query directives: directives in `save$`](reference/query-directives.md#directives-in-save) |
| `custom$`, `directive$`, `entity$`, `zone$`, `base$`, `name$` | [Query directives: entity level directives](reference/query-directives.md#entity-level-directives) |
| `<field>_$` escape | [Query directives: escaped field names](reference/query-directives.md#escaped-field-names) |

### Errors

| Error | Reference |
| ----- | --------- |
| `Entity: invalid entity canon` | [Errors: thrown by the entity API](reference/errors.md#thrown-by-the-entity-api) |
| `Entity: unknown entity` (`strict`) | [Errors: thrown by the entity API](reference/errors.md#thrown-by-the-entity-api) |
| `GubuError` (validation) | [Errors: thrown by the entity API](reference/errors.md#thrown-by-the-entity-api) |
| `invalid_plugin_option` | [Errors: raised when a plugin loads](reference/errors.md#raised-when-a-plugin-loads) |
| `store_cmd_missing` | [Errors: raised when a plugin loads](reference/errors.md#raised-when-a-plugin-loads) |
| `act_not_found` (no store) | [Errors: replied by actions](reference/errors.md#replied-by-actions) |
| `entity-id-exists`, `generate-invalid-entity-id` (default store) | [Errors: replied by actions](reference/errors.md#replied-by-actions) |
| `act_execute`, `act_invalid_msg`, `action_timeout` | [Errors: replied by actions](reference/errors.md#replied-by-actions) |

## Other documents

* [Change log](../CHANGES.md)
* [Code of conduct](../CODE_OF_CONDUCT.md)
* [License](../LICENSE)
