# Query, sort and page

How to find entities by field values, order the results, fetch them in
pages and restrict the fields returned. The complete program is
[docs/examples/how-to/query-sort-page.js](../examples/how-to/query-sort-page.js);
the full list of query forms is in
[Query directives](../reference/query-directives.md).

The query object given to `list$`, `load$` and `remove$` has two kinds
of properties: fields (no `$`), which must equal the stored values, and
directives (ending in `$`), which shape the result. What a directive
does is decided by the store; the behaviour shown is that of
seneca-mem-store, which the official stores follow.

## 1. Filter by field values

```js
const Product = seneca.entity('shop/product')

const names = ['apple', 'pear', 'kiwi', 'plum', 'fig']
for (let i = 0; i < names.length; i++) {
  await Product.make$({ id$: 'p' + i, name: names[i], price: (i + 1) * 10, stock: i % 2 }).save$()
}

await Product.list$({ stock: 1 })           // every product with stock equal to 1
```

Several fields in the query must all match. There is no `or`; run two
queries or use a store specific operator.

## 2. Match several values

An array of ids lists those entities; a field whose value is an array
matches any of the values:

```js
await Product.list$(['p0', 'p4'])
await Product.list$({ name: ['kiwi', 'fig'] })
```

## 3. Sort

`sort$` is an object with the field name and the direction, `1` for
ascending and `-1` for descending. seneca-mem-store uses the first
field only.

```js
await Product.list$({ sort$: { price: -1 } })
```

## 4. Page

Sort first, then skip and limit. Without a sort the order is the
store's, which may change between calls.

```js
await Product.list$({ sort$: { price: 1 }, skip$: 2, limit$: 2 })   // the second page of two
```

Negative or non-numeric values of `skip$` and `limit$` are ignored, and so is `limit$: 0`.

## 5. Return only some fields

```js
await Product.list$({ name: 'fig', fields$: ['price'] })  // [ { price: 50, id: 'p4' } ]
```

`id` is always included. The entities returned carry only the listed
fields, so saving one of them with `merge$: false` would drop the
others.

## 6. Load the first match

`load$` takes the same query and returns the first result or `null`.
With `sort$` it returns the first in that order:

```js
await Product.load$({ sort$: { price: 1 } })   // the cheapest product
```

## 7. Store specific operators

seneca-mem-store understands comparison operators in field values:

```js
await Product.list$({ price: { $gte: 30 } })
```

The operators are `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in` and
`$nin`. They are not part of the entity API; other stores have their
own query extensions (or none), so use them knowingly.

## 8. Count

There is no count operation. List with an empty `fields$` to transfer
as little as possible and take the length:

```js
(await Product.list$({ fields$: [] })).length
```

## The program's output

```
stock 1:   [ 'pear', 'plum' ]
ids:       [ 'apple', 'fig' ]
name in:   [ 'kiwi', 'fig' ]
by price:  [ 50, 40, 30, 20, 10 ]
page 2:    [ 'kiwi', 'plum' ]
fields$:   [ { price: 50, id: 'p4' } ]
cheapest:  apple
price>=30: [ 'kiwi', 'plum', 'fig' ]
count:     5
```
