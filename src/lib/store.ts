/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License */

const allcmds = ['save', 'load', 'list', 'remove', 'close', 'native']

function Store() {
  const tag_count_map: any = {}

  function make_tag(store_name: any) {
    tag_count_map[store_name] = (tag_count_map[store_name] || 0) + 1
    return tag_count_map[store_name]
  }

  // TODO: expose via seneca.export, and deprecate seneca.store
  const store = {
    cmds: allcmds.slice(0),

    // opts.map = { canon: [cmds] }
    // canon is in string format zone/base/name, with empty or - indicating undefined
    init: function(instance: any, opts: any, store: any, cb: any) {
      const entspecs = []

      if (opts.map) {
        for (const canon in opts.map) {
          let cmds = opts.map[canon]
          if (cmds === '*') {
            cmds = allcmds
          }
          entspecs.push({ canon: canon, cmds: cmds })
        }
      } else {
        entspecs.push({ canon: '-/-/-', cmds: allcmds })
      }

      // TODO: messy!
      const plugin_tag =
        instance.fixedargs &&
        instance.fixedargs.plugin$ &&
        instance.fixedargs.plugin$.tag
      // plugin_tag cannot be a strict null equal
      const tag =
        plugin_tag == null || plugin_tag === '-'
          ? make_tag(store.name)
          : plugin_tag

      const storedesc = [store.name, tag]

      for (let esI = 0; esI < entspecs.length; esI++) {
        const entspec = entspecs[esI]

        storedesc.push(entspec.canon)
        let zone: string | undefined
        let base: string | undefined
        let name: string | undefined

        // FIX: should use parsecanon

        let m = /^(\w*|-)\/(\w*|-)\/(\w*|-)$/.exec(entspec.canon)
        if (m) {
          zone = m[1]
          base = m[2]
          name = m[3]
        } else if ((m = /^(\w*|-)\/(\w*|-)$/.exec(entspec.canon))) {
          base = m[1]
          name = m[2]
        } else if ((m = /^(\w*|-)$/.exec(entspec.canon))) {
          name = m[1]
        }

        zone = zone === '-' ? void 0 : zone
        base = base === '-' ? void 0 : base
        name = name === '-' ? void 0 : name

        const entargs: any = {}
        if (void 0 !== name) entargs.name = name
        if (void 0 !== base) entargs.base = base
        if (void 0 !== zone) entargs.zone = zone

        entspec.cmds.forEach(function(cmd: string) {
          const args = Object.assign({ role: 'entity', cmd: cmd }, entargs)
          const orig_cmdfunc = store[cmd]
          let cmdfunc = orig_cmdfunc

          if (null == cmdfunc) {
            return instance.die('store_cmd_missing', {
              cmd: cmd,
              store: storedesc,
            })
          }

          cmdfunc = Intern.reify_entity_wrap(cmdfunc, cmd, zone, base, name)

          // if (Intern.cmd_wrap[cmd]) {
          //   cmdfunc = Intern.cmd_wrap[cmd](cmdfunc)
          // }

          for (const p in orig_cmdfunc) {
            cmdfunc[p] = orig_cmdfunc[p]
          }

          if (cmd !== 'close') {
            instance.add(args, cmdfunc)
          } else if (cmd === 'close') {
            instance.add(
              'role:seneca,cmd:close',
              function(this: any, close_args: any, done: any) {
                const closer = this

                if (!store.closed$) {
                  cmdfunc.call(closer, close_args, function(err: any) {
                    if (err) closer.log.error('close-error', close_args, err)

                    store.closed$ = true
                    closer.prior(close_args, done)
                  })
                } else {
                  return closer.prior(close_args, done)
                }
              }
            )
          }
        })
      }

      // legacy
      if (cb) {
        cb.call(instance, null, tag, storedesc.join('~'))
      } else {
        return {
          tag: tag,
          desc: storedesc.join('~'),
        }
      }
    },
  }

  return store
}

const Intern: any = {
  // Ensure entity objects are instantiated
  reify_entity_wrap: function(
    cmdfunc: any,
    cmd: string,
    zone?: string,
    base?: string,
    name?: string
  ) {
    const outfunc = function(this: any, msg: any, reply: any, meta: any) {
      if ('save' !== msg.cmd) {
        if (null == msg.q) {
          msg.q = {}

          if (null != msg.id) {
            msg.q.id = msg.id
            delete msg.id
          }
        }

        if (null == msg.qent) {
          msg.qent = this.make$({
            entity$: {
              name: msg.name,
              base: msg.base,
              zone: msg.zone,
            },
          })
        }
      }

      if (null != msg.ent && 'function' != typeof msg.ent.canon$) {
        msg.ent = this.make$({
          entity$: {
            name: msg.name,
            base: msg.base,
            zone: msg.zone,
          },
        }).data$(msg.ent)
      }

      return cmdfunc.call(this, msg, reply, meta)
    }

    Object.defineProperty(outfunc, 'name', {
      value:
        'entity_' +
        cmd +
        (null == zone ? '' : zone + '_') +
        (null == base ? '' : base + '_') +
        (null == name ? '' : name),
    })

    return outfunc
  },
}

export { Intern, Store }
