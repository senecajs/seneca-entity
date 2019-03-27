![Seneca Entity](http://senecajs.org/files/assets/seneca-logo.png)

> _Seneca Entity_ is an entity plugin for [Seneca](http://senecajs.org)

# Seneca Entity
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Dependency Status][david-badge]][david-url]
[![Coveralls][BadgeCoveralls]][Coveralls]
[![Maintainability](https://api.codeclimate.com/v1/badges/a285dd6eeb3cbcf39f38/maintainability)](https://codeclimate.com/github/senecajs/seneca-entity/maintainability)
[![Gitter][gitter-badge]][gitter-url]


The best place to start is
the [Data Entities tutorial](http://senecajs.org/docs/tutorials/understanding-data-entities.html)
on the [Seneca](http://senecajs.org/) site.


If you're using this module, and need help, you can:

- Post a [github issue][],
- Tweet to [@senecajs][],
- Ask on the [Gitter][gitter-url].

### Seneca compatibility
Supports Seneca versions **2.x** and above.

## Install
To install, simply use npm.


```
npm install seneca-entity
```


## Using Seneca Entity

```js
require('seneca')()
  .use('entity')
```

### For Seneca >= 3.x

```js
require('seneca')()
  .use('basic')
  .use('entity')
```

## Contributing
The [Senecajs org][] encourage open participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features please get in touch.

## Test
To run tests, simply use npm:

```
npm run test
```

## License
Copyright (c) 2016, Richard Rodger and other contributors.
Licensed under [MIT][].

[travis-badge]: https://travis-ci.org/senecajs/seneca-entity.svg
[travis-url]: https://travis-ci.org/senecajs/seneca-entity
[npm-badge]: https://badge.fury.io/js/seneca-entity.svg
[npm-url]: https://badge.fury.io/js/seneca-entity
[david-badge]: https://david-dm.org/senecajs/seneca-entity.svg
[david-url]: https://david-dm.org/senecajs/seneca-entity
[coveralls-badge]:https://coveralls.io/repos/senecajs/seneca-entity/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/senecajs/seneca-entity?branch=master
[github issue]: https://github.com/senecajs/seneca-entity/issues
[@senecajs]: http://twitter.com/senecajs
[gitter-badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/senecajs/seneca
[Senecajs org]: https://github.com/senecajs/
[Coveralls]: https://coveralls.io/github/senecajs/seneca-entity?branch=master
[BadgeCoveralls]: https://coveralls.io/repos/github/senecajs/seneca-entity/badge.svg?branch=master
[MIT]: ./LICENSE
