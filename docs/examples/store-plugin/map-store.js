// Tutorial: Writing a store plugin.
// A complete, minimal store that keeps entities in JavaScript Maps.
// It supports the query directives sort$, skip$, limit$, fields$, all$,
// load$ and merge$, and the id$ directive for chosen ids.

function map_store(options) {
  const seneca = this

  // The entity plugin exports the store initializer and the id generator.
  const init = seneca.export('entity/init')
  const generate_id = seneca.export('entity/generate_id')

  // One Map of id to plain data per entity kind (zone/base/name).
  const tables = new Map()

  function table(ent) {
    const key = ent.canon$({ string: true })
    if (!tables.has(key)) {
      tables.set(key, new Map())
    }
    return tables.get(key)
  }

  // Select rows matching the query. The query is an id, an array of ids,
  // or an object: field equality, then the directives.
  function select(rows, q) {
    if ('string' === typeof q || 'number' === typeof q) {
      q = { id: q }
    } else if (Array.isArray(q)) {
      q = { id: q }
    }

    let out = []
    for (const row of rows.values()) {
      let match = true
      for (const key of Object.keys(q)) {
        if (key.endsWith('$')) continue
        // An array of values matches any of them (used for lists of ids).
        const ok = Array.isArray(q[key]) ? q[key].includes(row[key]) : row[key] === q[key]
        if (!ok) {
          match = false
          break
        }
      }
      if (match) {
        out.push(seneca.util.deep(row)) // copies: callers must not share stored data
      }
    }

    if (q.sort$) {
      const [field, direction] = Object.entries(q.sort$)[0]
      const sign = direction < 0 ? -1 : 1
      out.sort((a, b) => sign * (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
    }
    if (q.skip$ > 0) {
      out = out.slice(q.skip$)
    }
    if (q.limit$ >= 0) {
      out = out.slice(0, q.limit$)
    }
    if (Array.isArray(q.fields$)) {
      out = out.map((row) => {
        const picked = { id: row.id }
        for (const field of q.fields$) {
          if (field in row) picked[field] = row[field]
        }
        return picked
      })
    }
    return out
  }

  const store = {
    name: 'map-store',

    // msg.ent is the entity to save; msg.q carries the directives.
    save(msg, reply) {
      const ent = msg.ent
      const q = msg.q || {}
      const rows = table(ent)
      // Plain fields only (no $ properties), copied so that the stored
      // data and the caller's entity do not share objects.
      const data = seneca.util.deep(ent.data$(false))

      if (null == ent.id) {
        // New entity: use the chosen id (id$) or generate one.
        data.id = null != ent.id$ ? ent.id$ : generate_id()
      } else if (rows.has(data.id) && false !== q.merge$ && false !== ent.merge$) {
        // Update: merge into the stored data unless merge$ is false.
        Object.assign(data, { ...rows.get(data.id), ...data })
      }

      rows.set(data.id, data)
      reply(null, ent.make$(seneca.util.deep(data)))
    },

    // msg.qent is a template entity of the kind queried; msg.q the query.
    load(msg, reply) {
      const list = select(table(msg.qent), msg.q)
      reply(null, 0 < list.length ? msg.qent.make$(list[0]) : null)
    },

    list(msg, reply) {
      const list = select(table(msg.qent), msg.q)
      reply(null, list.map((row) => msg.qent.make$(row)))
    },

    remove(msg, reply) {
      const q = msg.q
      const rows = table(msg.qent)
      let list = select(rows, q)
      if (!q.all$) {
        list = list.slice(0, 1)
      }
      for (const row of list) {
        rows.delete(row.id)
      }
      // load$:true asks for the removed entity (single removes only).
      const removed = !q.all$ && q.load$ && list[0] ? msg.qent.make$(list[0]) : null
      reply(null, removed)
    },

    // native$ exposes the underlying driver, here the Maps themselves.
    native(msg, reply) {
      reply(null, tables)
    },

    // Called once when the Seneca instance closes.
    close(msg, reply) {
      tables.clear()
      reply()
    },
  }

  // Register the store: adds the sys:entity,cmd:<command> actions for the canons
  // in options.map (all canons when map is empty).
  const meta = init(seneca, options, store)
  seneca.log.debug('store registered', meta.desc)

  return { name: store.name, tag: meta.tag }
}

// Plugin options: map is the canon to commands mapping used by init.
map_store.defaults = {
  map: {},
}

// Keep the plugin name stable even if the function is renamed by a bundler.
Object.defineProperty(map_store, 'name', { value: 'map-store' })

module.exports = map_store
