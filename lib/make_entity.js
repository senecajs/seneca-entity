/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Util = require('util')
var Eraro = require('eraro')
var Jsonic = require('jsonic')
var Common = require('./common')

var error = Eraro({
  package: 'seneca',
  msgmap: ERRMSGMAP(),
  override: true,
})

var toString_map = {}

function Entity(canon, seneca) {
  var self = Object.create(this)

  var private$ = (this.private$ = function () {})

  private$.get_instance = function () {
    return seneca
  }

  private$.canon = canon

  private$.entargs = function (args) {
    args.role = 'entity'
    args.ent = self

    if (this.canon.name !== null) {
      args.name = this.canon.name
    }
    if (this.canon.base !== null) {
      args.base = this.canon.base
    }
    if (this.canon.zone !== null) {
      args.zone = this.canon.zone
    }

    return args
  }

  // use as a quick test to identify Entity objects
  // returns compact string zone/base/name
  self.entity$ = self.canon$()

  let canon_str = this.canon$({ string: true })
  this.toString = (toString_map[canon_str] || toString_map['']).bind(self)

  return self
}

Entity.prototype.__promisify$$ = true

Entity.prototype.log$ = function () {
  // use this, as make$ will have changed seneca ref
  var seneca = this.private$.get_instance()
  seneca.log.apply(seneca, arguments)
}

// Properties without '$' suffix are persisted
// id property is special: created if not present when saving
//   lack of id indicates new data record to create
//   to set id of a new record, use id$
// func$ functions provide persistence operations
// args: (<zone>,<base>,<name>,<props>)
// can be partially specified:
// make$(name)
// make$(base,name)
// make$(zone,base,name)
// make$(zone,base,null)
// make$(zone,null,null)
// props can specify zone$,base$,name$, but args override if present
// escaped names: foo_$ is converted to foo
Entity.prototype.make$ = function () {
  var self = this
  var args = Common.arrayify(arguments)

  // Set seneca instance, if provided as first arg.
  if (args[0] && args[0].seneca) {
    var seneca = args.shift()
    self.private$.get_instance = function () {
      return seneca
    }
  }

  var first = args[0]
  if (first && first.entity$ && 'function' === typeof first.canon$) {
    return first
  }

  // Pull out props, if present.
  var argprops = args[args.length - 1]
  var props = {}
  if (argprops && typeof argprops === 'object') {
    args.pop()
    props = { ...argprops }
  }

  // Normalize args.
  while (args.length < 3) {
    args.unshift(null)
  }

  var canon
  if ('string' === typeof props.entity$) {
    canon = parsecanon(props.entity$)
  } else if (props.entity$ && 'object' === typeof props.entity$) {
    canon = {}
    canon.zone = props.entity$.zone
    canon.base = props.entity$.base
    canon.name = props.entity$.name
  } else {
    var argsname = args.pop()
    argsname = argsname == null ? props.name$ : argsname
    canon = parsecanon(argsname)
  }

  var name = canon.name

  var base = args.pop()
  base = base == null ? canon.base : base
  base = base == null ? props.base$ : base

  var zone = args.pop()
  zone = zone == null ? canon.zone : zone
  zone = zone == null ? props.zone$ : zone

  var new_canon = {}
  new_canon.name = name == null ? self.private$.canon.name : name
  new_canon.base = base == null ? self.private$.canon.base : base
  new_canon.zone = zone == null ? self.private$.canon.zone : zone

  var entity = new Entity(new_canon, self.private$.get_instance())
  //var canon_str = entity.canon$({ string: true })

  for (var p in props) {
    if (Object.prototype.hasOwnProperty.call(props, p)) {
      if (!~p.indexOf('$')) {
        entity[p] = props[p]
      } else if (p.length > 2 && p.slice(-2) === '_$') {
        entity[p.slice(0, -2)] = props[p]
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(props, 'id$')) {
    entity.id$ = props.id$
  }

  //entity.toString = (toString_map[canon_str] || toString_map['']).bind(entity)

  // Remove override of inspection
  // entity[Util.inspect.custom] = entity.toString

  self.log$('make', entity.canon$({ string: true }), entity)
  return entity
}

/** Save the entity.
 *  @param {object} [data] - Subset of entity field values.
 *  @param {callback~save$} done - Callback function providing saved entity.
 */
Entity.prototype.save$ = async function (data, done) {
  var self = this
  var si = self.private$.get_instance()
  var q = {}

  if ('function' === typeof data) {
    done = data
  } else if (data && 'object' === typeof data) {
    // TODO: this needs to be deprecated as first param needed for
    // directives, not data - that's already in entity object
    self.data$(data)

    q = data
  }

  var async = is_async(si, done)
  var entmsg = self.private$.entargs({ cmd: 'save', q: q })

  return async ? si.post(entmsg) : (si.act(entmsg, done), self)
}

/** Callback for Entity.save$.
 *  @callback callback~save$
 *  @param {error} error - Error object, if any.
 *  @param {Entity} entity - Saved Entity object containing updated data fields (in particular, `id`, if auto-generated).
 */

// provide native database driver
Entity.prototype.native$ = function (done) {
  var self = this
  var si = self.private$.get_instance()

  var async = is_async(si, done)
  var entmsg = self.private$.entargs({ cmd: 'native' })

  return async ? si.post(entmsg) : (si.act(entmsg, done), self)
}

// load one
// TODO: qin can be an entity, in which case, grab the id and reload
// qin omitted => reload self

/** Load the entity.
 *  @param {object|string|number} [query] - Either a entity id, or a query object with field values that must match.
 *  @param {callback~load$} done - Callback function providing loaded entity, if found.
 */
Entity.prototype.load$ = function (query, done) {
  var self = this
  var si = self.private$.get_instance()

  var qent = self

  var q = resolve_id_query(query, self)

  done = 'function' === typeof query ? query : done

  var async = is_async(si, done)

  // empty query gives empty result
  if (q == null) {
    return async ? null : (done && done.call(si), self)
  }

  var entmsg = self.private$.entargs({ qent: qent, q: q, cmd: 'load' })

  return async ? si.post(entmsg) : (si.act(entmsg, done), self)
}

/** Callback for Entity.load$.
 *  @callback callback~load$
 *  @param {error} error - Error object, if any.
 *  @param {Entity} entity - Matching `Entity` object, if found.
 */

// TODO: need an update$ - does an atomic upsert

// list zero or more
// qin is optional, if omitted, list all

/** Load the entity.
 *  @param {object|string|number} [query] - A query object with field values that must match, can be empty.
 *  @param {callback~list$} done - Callback function providing list of matching `Entity` objects, if any.
 */
Entity.prototype.list$ = function (query, done) {
  var self = this
  var si = self.private$.get_instance()

  var qent = self
  var q = query
  if ('function' === typeof query) {
    q = {}
    done = query
  }

  var async = is_async(si, done)
  var entmsg = self.private$.entargs({ qent: qent, q: q, cmd: 'list' })

  return async ? si.post(entmsg) : (si.act(entmsg, done), self)
}

/** Callback for Entity.list$.
 *  @callback callback~list$
 *  @param {error} error - Error object, if any.
 *  @param {Entity} entity - Array of `Entity` objects matching query.
 */

// remove one or more
// TODO: make qin optional, in which case, use id

/** Remove the `Entity`.
 *  @param {object|string|number} [query] - Either a entity id, or a query object with field values that must match.
 *  @param {callback~remove$} done - Callback function to confirm removal.
 */
Entity.prototype.remove$ = function (query, done) {
  var self = this
  var si = self.private$.get_instance()

  var q = resolve_id_query(query, self)

  done = 'function' === typeof query ? query : done

  var async = is_async(si, done)

  // empty query means take no action
  if (q == null) {
    return async ? null : (done && done.call(si), self)
  }

  var entmsg = self.private$.entargs({ qent: self, q: q, cmd: 'remove' })

  return async ? si.post(entmsg) : (si.act(entmsg, done), self)
}
Entity.prototype.delete$ = Entity.prototype.remove$

/** Callback for Entity.remove$.
 *  @callback callback~remove$
 *  @param {error} error - Error object, if any.
 */

Entity.prototype.fields$ = function () {
  var self = this

  var fields = []
  for (var p in self) {
    if (
      Object.prototype.hasOwnProperty.call(self, p) &&
      typeof self[p] !== 'function' &&
      p.charAt(p.length - 1) !== '$'
    ) {
      fields.push(p)
    }
  }
  return fields
}

/* TODO: is this still needed? */
Entity.prototype.close$ = function (done) {
  var self = this
  var si = self.private$.get_instance()

  var async = is_async(si, done)
  var entmsg = self.private$.entargs({ cmd: 'close' })

  self.log$('close')
  return async ? si.post(entmsg) : (si.act(entmsg, done), self)
}

Entity.prototype.is$ = function (canonspec) {
  var self = this

  var canon = canonspec
    ? canonspec.entity$
      ? canonspec.canon$({ object: true })
      : parsecanon(canonspec)
    : null

  if (!canon) return false

  return Util.inspect(self.canon$({ object: true })) === Util.inspect(canon)
}

Entity.prototype.canon$ = function (opt) {
  var self = this

  var canon = self.private$.canon

  if (opt) {
    if (opt.isa) {
      var isa = parsecanon(opt.isa)

      // NOTE: allow null == void 0
      return (
        isa.zone == canon.zone &&
        isa.base == canon.base &&
        isa.name == canon.name
      )
    } else if (opt.parse) {
      return parsecanon(opt.parse)
    } else if (opt.change) {
      // DEPRECATED
      // change type, undef leaves untouched
      canon.zone = opt.change.zone == null ? canon.zone : opt.change.zone
      canon.base = opt.change.base == null ? canon.base : opt.change.base
      canon.name = opt.change.name == null ? canon.name : opt.change.name

      // explicit nulls+undefs delete
      if (null == opt.zone) delete canon.zone
      if (null == opt.base) delete canon.base
      if (null == opt.name) delete canon.name

      self.entity$ = self.canon$()
    }
  }

  return null == opt || opt.string || opt.string$
    ? [
        (opt && opt.string$ ? '$' : '') +
          (null == canon.zone ? '-' : canon.zone),
        null == canon.base ? '-' : canon.base,
        null == canon.name ? '-' : canon.name,
      ].join('/') // TODO: make joiner an option
    : opt.array
    ? [canon.zone, canon.base, canon.name]
    : opt.array$
    ? [canon.zone, canon.base, canon.name]
    : opt.object
    ? { zone: canon.zone, base: canon.base, name: canon.name }
    : opt.object$
    ? { zone$: canon.zone, base$: canon.base, name$: canon.name }
    : [canon.zone, canon.base, canon.name]
}

// data = object, or true|undef = include $, false = exclude $
Entity.prototype.data$ = function (data, canonkind) {
  var self = this
  var val

  // TODO: test for entity$ consistent?

  if (data && 'object' === typeof data) {
    // does not remove fields by design!
    for (var f in data) {
      if (f.charAt(0) !== '$' && f.charAt(f.length - 1) !== '$') {
        val = data[f]
        if (val && 'object' === typeof val && val.entity$) {
          self[f] = val.id
        } else {
          self[f] = val
        }
      }
    }

    if (data.id$ != null) {
      self.id$ = data.id$
    }

    if (null != data.merge$) {
      self.merge$ = data.merge$
    }

    return self
  } else {
    var include_$ = null == data ? true : !!data
    data = {}

    if (include_$) {
      canonkind = canonkind || 'object'
      var canonformat = {}
      canonformat[canonkind] = true
      data.entity$ = self.canon$(canonformat)
    }

    var fields = self.fields$()
    for (var fI = 0; fI < fields.length; fI++) {
      if (!~fields[fI].indexOf('$')) {
        val = self[fields[fI]]
        if (val && 'object' === typeof val && val.entity$) {
          data[fields[fI]] = val.id
        }

        // NOTE: null is allowed, but not undefined
        else if (void 0 !== val) {
          data[fields[fI]] = val
        }
      }
    }

    return data
  }
}

Entity.prototype.clone$ = function () {
  var self = this
  return self.make$(
    this.private$.get_instance().util.deepextend({}, self.data$())
  )
}

function resolve_id_query(qin, ent) {
  var q

  if ((null == qin || 'function' === typeof qin) && ent.id != null) {
    q = { id: ent.id }
  } else if ('string' === typeof qin || 'number' === typeof qin) {
    q = qin === '' ? null : { id: qin }
  } else if ('function' === typeof qin) {
    q = null
  } else {
    q = qin
  }

  return q
}

// parse a canon string:
// $zone-base-name
// $, zone, base are optional
function parsecanon(str) {
  var out = {}

  if (Array.isArray(str)) {
    return {
      zone: str[0],
      base: str[1],
      name: str[2],
    }
  }

  if (str && 'object' === typeof str && 'function' !== typeof str) return str

  if ('string' !== typeof str) return out

  var m = /\$?((\w+|-)\/)?((\w+|-)\/)?(\w+|-)/.exec(str)
  if (m) {
    var zi = m[4] == null ? 4 : 2
    var bi = m[4] == null ? 2 : 4

    out.zone = m[zi] === '-' ? void 0 : m[zi]
    out.base = m[bi] === '-' ? void 0 : m[bi]
    out.name = m[5] === '-' ? void 0 : m[5]
  } else throw error('invalid_canon', { str: str })

  return out
}

function ERRMSGMAP() {
  return {
    invalid_canon:
      'Invalid entity canon: <%=str%>; expected format: zone/base/name.',
  }
}

function handle_options(entopts) {
  if (entopts.hide) {
    //_.each(entopts.hide, function (hidden_fields, canon_in) {
    Object.keys(entopts.hide).forEach((hidden_fields) => {
      //, function (hidden_fields, canon_in) {
      var canon_in = entopts.hide[hidden_fields]
      var canon = parsecanon(canon_in)

      var canon_str = [
        canon.zone == null ? '-' : canon.zone,
        canon.base == null ? '-' : canon.base,
        canon.name == null ? '-' : canon.name,
      ].join('/')

      toString_map[canon_str] = make_toString(canon_str, hidden_fields, entopts)
    })
  }
}

function make_toString(canon_str, hidden_fields_spec, opts) {
  opts = opts || { jsonic: {} }

  var hidden_fields = []

  if (Array.isArray(hidden_fields_spec)) {
    hidden_fields.concat(hidden_fields_spec)
  } else if (hidden_fields_spec && 'object' === typeof hidden_fields_spec) {
    Object.keys(hidden_fields_spec).forEach((k) => {
      hidden_fields.push(k)
    })
  }

  hidden_fields.push('id')

  return function () {
    return [
      '$',
      canon_str || this.canon$({ string: true }),
      ';id=',
      this.id,
      ';',
      Jsonic.stringify(this, {
        omit: hidden_fields,
        depth: opts.jsonic.depth,
        maxitems: opts.jsonic.maxitems,
        maxchars: opts.jsonic.maxchars,
      }),
    ].join('')
  }
}

function is_async(seneca, done) {
  var promisify_loaded =
    true === seneca.root.__promisify$$ || 'function' === typeof seneca.post

  var has_callback = 'function' === typeof done

  return promisify_loaded && !has_callback
}

module.exports = function make_entity(canon, seneca, opts) {
  handle_options(opts)
  toString_map[''] = make_toString(null, null, null)

  return new Entity(canon, seneca)
}

module.exports.parsecanon = parsecanon
module.exports.Entity = Entity
