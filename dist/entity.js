"use strict";
/* Copyright (c) 2010-2022 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./lib/common");
const make_entity_1 = require("./lib/make_entity");
const store_1 = require("./lib/store");
const default_opts = {
    mem_store: true,
    server: false,
    client: false,
    generate_id: common_1.generate_id,
    // Control stringification of entities
    jsonic: {
        depth: 7,
        maxitems: 11,
        maxchars: 111,
    },
    log: {
        active: false,
    },
    meta: {
        // Provide action meta object as third argument to callbacks.
        provide: true,
    },
};
/** Define the `entity` plugin. */
function entity() {
    return {
        name: 'entity',
    };
}
// All functionality should be loaded when defining plugin
function preload(context) {
    const seneca = this;
    const opts = seneca.util.deepextend({}, default_opts, context.options);
    const store = (0, store_1.Store)();
    // Removes dependency on seneca-basic
    // TODO: deprecate this
    seneca.add('role:basic,cmd:generate_id', common_1.generate_id);
    seneca.util.parsecanon = seneca.util.parsecanon || make_entity_1.MakeEntity.parsecanon;
    // Create entity delegate.
    const sd = seneca.delegate();
    // Template entity that makes all others.
    seneca.private$.entity = seneca.private$.entity || (0, make_entity_1.MakeEntity)({}, sd, opts);
    // Expose the Entity object so third-parties can do interesting things with it
    seneca.private$.exports.Entity =
        seneca.private$.exports.Entity || make_entity_1.Entity;
    if (opts.log.active) {
        seneca.private$.exports.Entity.prototype.log$ = function () {
            // Use this, as make$ will have changed seneca ref.
            const seneca = this.private$.get_instance();
            seneca.log.apply(seneca, arguments);
        };
    }
    // all optional
    function build_api_make(promise) {
        return function () {
            return seneca.private$.entity.make$(this, ...[...arguments, promise]);
        };
    }
    let make = build_api_make(false);
    let entity = build_api_make(true);
    if (!seneca.make$) {
        seneca.decorate('make$', make);
    }
    if (!seneca.make) {
        seneca.decorate('make', make);
    }
    // TODO: make this work
    // if (!seneca.entity$) {
    //   seneca.decorate('entity$', entity)
    // }
    if (!seneca.entity) {
        seneca.decorate('entity', entity);
    }
    // Handle old versions of seneca where the
    // store init was already included by default.
    if (!seneca.store || !seneca.store.init) {
        seneca.decorate('store', store);
    }
    // Ensures legacy versions of seneca that load mem-store do not
    // crash the system. Seneca 2.x and lower loads mem-store by default.
    if (!seneca.options().default_plugins['mem-store'] &&
        opts.mem_store &&
        !opts.client) {
        seneca.root.use(require('seneca-mem-store'));
    }
    // FIX: does not work! need to invert this so
    // older stuff hits role then sys
    // Prepare transition from role: to sys:
    this.translate('sys:entity,cmd:load', 'role:entity')
        .translate('sys:entity,cmd:save', 'role:entity')
        .translate('sys:entity,cmd:list', 'role:entity')
        .translate('sys:entity,cmd:remove', 'role:entity');
    if (opts.client) {
        this.translate('role:entity,cmd:load', 'role:remote-entity')
            .translate('role:entity,cmd:save', 'role:remote-entity')
            .translate('role:entity,cmd:list', 'role:remote-entity')
            .translate('role:entity,cmd:remove', 'role:remote-entity');
        this.translate('sys:entity,cmd:load', 'sys:remote-entity')
            .translate('sys:entity,cmd:save', 'sys:remote-entity')
            .translate('sys:entity,cmd:list', 'sys:remote-entity')
            .translate('sys:entity,cmd:remove', 'sys:remote-entity');
    }
    else if (opts.server) {
        this.translate('role:remote-entity,cmd:load', 'role:entity')
            .translate('role:remote-entity,cmd:save', 'role:entity')
            .translate('role:remote-entity,cmd:list', 'role:entity')
            .translate('role:remote-entity,cmd:remove', 'role:entity');
        this.translate('sys:remote-entity,cmd:load', 'sys:entity')
            .translate('sys:remote-entity,cmd:save', 'sys:entity')
            .translate('sys:remote-entity,cmd:list', 'sys:entity')
            .translate('sys:remote-entity,cmd:remove', 'sys:entity');
    }
    return {
        name: 'entity',
        exports: {
            store: store,
            init: store.init,
            generate_id: opts.generate_id,
        },
    };
}
entity.preload = preload;
exports.default = entity;
if ('undefined' !== typeof (module)) {
    module.exports = entity;
}
//# sourceMappingURL=entity.js.map