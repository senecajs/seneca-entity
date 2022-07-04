![Seneca Entity](http://senecajs.org/files/assets/seneca-logo.png)

> _Seneca Entity_ is a plugin for [Seneca](http://senecajs.org)

Provides a simple Object-Relation Mapping over Seneca messages as a
convenience API for manipulating data.

Any data store can then be accessed using the full power of Seneca
messages.

[![npm version](https://img.shields.io/npm/v/seneca-entity.svg)](https://npmjs.com/package/seneca-entity)
[![build](https://github.com/senecajs/seneca-entity/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-entity/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-entity/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-entity?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-entity/badge.svg)](https://snyk.io/test/github/senecajs/seneca-entity)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19453/branches/505563/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19453&bid=505563)
[![Maintainability](https://api.codeclimate.com/v1/badges/9d54b38a991fe7b92a43/maintainability)](https://codeclimate.com/github/senecajs/seneca-entity/maintainability)


# seneca-entity

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |

## Install

With _npm_:
```
$ npm install seneca-entity
```

With _yarn_:
```
$ yarn add seneca-entity
```

### TypeScript

Implemented using TypeScript. Minimal types are provided by the package. 


## Quick Example

Please visit [senecajs.org](http://senecajs.org) for a more complete
overview and documentation of the Seneca framework.

Read the [Understanding Data Entities](https://senecajs.org/docs/tutorials/understanding-data-entities.html) tutorial for a step-by-step introduction to Seneca data entities.

```js
const Seneca = require('seneca')

const seneca = Seneca() // Create a new instance of Seneca.
  .use('entity')        // Use the seneca-entity plugin (Seneca will require it).
  
// Create an reusable instance of the `person` entity.
const Person = seneca.entity('person')

// Create a specific person instance.
let alice = Person.make$()

// Set some fields (assumes a NoSQL database, or a predefined table).
// Properties with a final `$` are reserved for the Entity API methods.
alice.name = 'Alice'
alice.location = 'Wonderland'

// Save your data. Seneca entity provides a default in-memory store,
// which is very useful for fast unit tests.
alice = await alice.save$()

// The `alice` entity now has an `id` field.
let alsoAlice = await Person.load$(alice.id)
alsoAlice.location = 'Looking Glass'

// The `alsoAlice` entity will be updated, not created, because
// it has an `id` field. The save$ method both creates and updates.
await alsoAlice.save$()

// Entity methods can be chained (until they return a Promise).
let lily = await Person
    .make$({
      name: 'Lily',
      location: 'Looking Glass'
    })
    .save$()

// The data$ method exports a JSON serializable verson of the entity
// as a plain object.
console.log(lily.data$())

// The data$ method can alternatively set multiple fields.
await lily
  .data$({
    game: 'chess'
  })
  .save$()


// List all the person entities.
let people = await Person.list$()

// List only those person entities with field `game` equal to the string "chess".
let players = await Person.list$({game: 'chess'})
```

Seneca Entity is inspired in part by the
[ActiveRecord](https://www.martinfowler.com/eaaCatalog/activeRecord.html)
pattern as implemented by [Ruby on
Rails](https://guides.rubyonrails.org/active_record_basics.html).

Seneca Entity is **not** a full [Object Relation
Mapping](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). It
is a convenience API over the Seneca action patterns:

* `role:entity,cmd:load` - `.load$()`
* `role:entity,cmd:save` - `.save$()`
* `role:entity,cmd:list` - `.list$()`
* `role:entity,cmd:remove` - `.remove$()`

This means that you can extend the "ORM" using the same message
manipulation as with all Seneca messages, including sending them over
the network to other microservices.

In particular, you can:

* Support pretty much any kind of database for a standard set of basic operations, extending the query syntax if necessary - [@seneca/s3-store](senecajs/seneca-s3-store)
* Easily define reusable business logic that assumes standard entities, but is still extensible - [@seneca/user](senecajs/seneca-user)
* Add cross-cutting concerns without polluting your business logic - [@seneca/allow](senecajs/seneca-allow)
* Customize specific operations for specific entities by adding your own action patterns - `seneca.message('role:entity,cmd:save,name:person', async function(msg) { ... })`
* Expose most REST or GraphQL APIs as "databases" - [@seneca/trello-provider](senecajs/seneca-trello-provider)
* Use different databases for different entities, see [Mapping Entities to Data Stores](https://senecajs.org/docs/tutorials/understanding-data-entities.html#mapping-entities-to-data-stores)
* Namespace and isolate entities as desired; entities have not just a _name_, but also an optional _base_ (table namespace) and _zone_ (good for strict multi-tenancy), to ue as you see fit.

**BUT**, Seneca entity does not natively implement relations, and
loads only the top level entity. Since relation mapping often leads to
inefficient queries, this is not such a bad thing. When relations are
needed, you can implement them manually by customizing the appropriate
action patterns. Or you may find that [denormalizing your
data](https://livebook.manning.com/book/the-tao-of-microservices/chapter-4/)
is more fun than you think.


## More Examples

## API



## Contributing

## Background



## License
Copyright (c) 2012-2022, Richard Rodger and other contributors.
Licensed under [MIT](./LICENSE).

