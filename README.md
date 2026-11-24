![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](https://www.npmjs.com/package/seneca) plugin

# @seneca/entity

The Seneca entity plugin: a data API in the style of ActiveRecord,
built on Seneca messages. `seneca.entity('person')` gives you objects
with `save$`, `load$`, `list$` and `remove$` methods, and each method
is a message (`sys:entity,cmd:save`) answered by a store plugin, so
stores, validation, business rules and remote services plug in through
ordinary Seneca patterns. An in-memory store is included. Requires
Seneca 4 and Node.js 24 or later. Seneca 3 applications keep
seneca-entity 28.

[![npm version](https://img.shields.io/npm/v/@seneca/entity.svg)](https://npmjs.com/package/@seneca/entity)
[![build](https://github.com/senecajs/seneca-entity/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-entity/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-entity/badge.svg)](https://snyk.io/test/github/senecajs/seneca-entity)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19453/branches/505563/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19453&bid=505563)
[![Maintainability](https://api.codeclimate.com/v1/badges/9d54b38a991fe7b92a43/maintainability)](https://codeclimate.com/github/senecajs/seneca-entity/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca@^4 @seneca/entity
```

Versions up to 28.1.0 were published as `seneca-entity`; from 29.0.0
the package is `@seneca/entity` (28.2.0 was prepared but not
published). Version 29 requires Seneca 4 (peer dependency `seneca`
`^4.0.0`). The default store, `@seneca/mem-store`, is installed with
it.

TypeScript declarations are included. They add `make$`, `make` and
`entity` to Seneca's `Instance` interface, so `seneca.entity('person')`
compiles in any project that imports `@seneca/entity` (also with
`import type {} from '@seneca/entity'`).

Load the plugin by package, `seneca.use(require('@seneca/entity'))`,
or by its full name, `seneca.use('@seneca/entity')`, not as
`seneca.use('entity')`. Plugins that still declare a peer dependency
on the old name, such as seneca-transport 8.3, @seneca/user 6.4,
@seneca/owner 6.4 and seneca-msg-test 4.1, make npm install
seneca-entity 28.1.0 (and seneca-mem-store 9.4.0) next to the new
packages, and a short name can load the old one, which stops Seneca 4
at startup (`plugin_gubu_shape`). Likewise, when you load the store
yourself, load it as `@seneca/mem-store`, not `mem-store`.

## Quick Example

```js
const Seneca = require('seneca')
const Entity = require('@seneca/entity')

async function main() {
  // Load the plugin by package (see Install).
  const seneca = Seneca({ log: 'warn' }).use(Entity)

  // A template for person entities; make$ creates new ones.
  const Person = seneca.entity('person')

  // save$ stores the entity (in memory by default) and returns it with an id.
  const alice = await Person.make$({ name: 'Alice', location: 'Wonderland' }).save$()

  // load$ by id; an entity with an id is updated when saved.
  const found = await Person.load$(alice.id)
  found.location = 'Looking Glass'
  await found.save$()

  await Person.make$({ name: 'Lily', game: 'chess' }).save$()

  // list$ with a query: fields must match; $ directives shape the result.
  console.log(await Person.list$({ sort$: { name: 1 } }))
  console.log(await Person.list$({ game: 'chess' }))

  await seneca.close()
}

main()
```

```
[
  Entity {
    'entity$': '-/-/person',
    name: 'Alice',
    location: 'Looking Glass',
    id: '86fwbo'
  },
  Entity {
    'entity$': '-/-/person',
    name: 'Lily',
    game: 'chess',
    id: 'tvksft'
  }
]
[
  Entity {
    'entity$': '-/-/person',
    name: 'Lily',
    game: 'chess',
    id: 'tvksft'
  }
]
```

## More Examples

* [Getting started with entities](docs/tutorials/getting-started.md):
  save, load, query and remove, with promises and callbacks.
* [Writing a store plugin](docs/tutorials/writing-a-store-plugin.md):
  connect your own storage.
* How-to guides: [query, sort and page](docs/how-to/query-sort-and-page.md),
  [validate entity data](docs/how-to/validate-entity-data.md),
  [use promises and async actions](docs/how-to/use-promises-and-async-actions.md),
  [share entities over a transport](docs/how-to/share-entities-over-a-transport.md),
  [configure the default store](docs/how-to/configure-the-default-store.md),
  [customize operations with priors](docs/how-to/customize-operations-with-priors.md),
  [test a store plugin](docs/how-to/test-a-store-plugin-with-store-test.md),
  [migrate from Seneca 3](docs/how-to/migrate-from-seneca-3.md).
* Runnable programs: [docs/examples](docs/examples/). The full index
  is [docs/README.md](docs/README.md).

## Motivation

Most services need to store and find data, and most of that work is
the same four operations. This plugin gives them a small, uniform API
whose operations are messages, so the choice of database, the routing
of kinds of data to different stores, validation, caching and access
rules can all be changed with patterns instead of code. It is not an
ORM: there are no relations or joins. See
[How entity methods map to actions and stores](docs/explanation/entities-actions-and-stores.md)
and [The canon model](docs/explanation/canon-model.md).

## Support

* Questions and bugs: [GitHub issues](https://github.com/senecajs/seneca-entity/issues).
* Seneca itself: the [Seneca documentation](https://github.com/senecajs/seneca/tree/master/docs).
* This plugin is sponsored and supported by [Voxgig](https://www.voxgig.com).

## API

The complete reference is in [docs/reference](docs/README.md#reference).

| Instance method | Purpose |
| --------------- | ------- |
| `seneca.entity([zone], [base], [name], [props])` | Create an entity whose methods return promises. |
| `seneca.make$(...)`, `seneca.make(...)` | Create an entity whose methods take callbacks. |
| `seneca.util.parsecanon(canon)` | Parse a `zone/base/name` string. |

| Entity method | Purpose |
| ------------- | ------- |
| `save$([data])` | Create (no `id`) or update (with `id`) the entity in its store. |
| `load$([query])` | Load the first match, or reload by `id`. |
| `list$([query])` | List the matches. |
| `remove$([query])` | Remove the first match (every match with `all$: true`). |
| `make$`, `data$`, `fields$`, `clone$`, `is$`, `canon$`, `valid$`, `custom$`, `directive$`, `native$` | See [Entity API](docs/reference/entity-api.md). |

| Topic | Reference |
| ----- | --------- |
| Query objects and `$` directives (`sort$`, `limit$`, `skip$`, `fields$`, `all$`, `id$`, `merge$`, `upsert$`, ...) | [Query directives](docs/reference/query-directives.md) |
| Action patterns (`sys:entity` with `cmd` `save`, `load`, `list`, `remove` and `native`; the `role:entity` translations) and exports (`entity/init`, `entity/generate_id`, `Entity`) | [Messages](docs/reference/messages.md) |
| Plugin options (`mem_store`, `ent`, `strict`, `generate_id`, ...) | [Options](docs/reference/options.md) |
| Writing stores (`entity/init`, commands, `map`) | [Store protocol](docs/reference/store-protocol.md) |
| Errors | [Errors](docs/reference/errors.md) |

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open
participation: documentation, examples, tests and features are all
welcome. To work on the plugin:

```sh
npm install
npm run build     # compile src/ to dist/ (tsc)
npm test          # jest, with coverage
```

The tests run on Node.js 24 and 26 against Seneca 4 (the
`seneca@^4.0.0` development dependency).

The programs in [docs/examples](docs/examples/) must run to completion
(`node docs/examples/<dir>/<file>.js`). `npm run maintain` runs the
`@seneca/maintain` repository checks.

## Background

Entities were part of Seneca core until Seneca 1.2.0 (2016), when they
moved into this plugin; Seneca 3.0.0 moved the store logic here as
well. The API is inspired in part by the
[ActiveRecord](https://www.martinfowler.com/eaaCatalog/activeRecord.html)
pattern. Versions up to 28.1.0 were published as `seneca-entity`; from
29.0.0 the package is `@seneca/entity`. Changes are listed in
[CHANGES.md](CHANGES.md).

| Plugin | Seneca | Node.js |
| ------ | ------ | ------- |
| 29.0.0 | 4 (`^4.0.0`) | 24 or later |
| 28.1.0 | 3.x; on 3.38 a `valid` shape built with `Seneca.util.Gubu` fails every save; does not load on 4.0.0 (`plugin_gubu_shape`) | 16 or later |

Licensed under the MIT license; see [LICENSE](LICENSE).
