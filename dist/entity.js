"use strict";
/* Copyright (c) 2010-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const gubu_1 = require("gubu");
const valid_1 = require("./valid");
const make_entity_1 = require("./lib/make_entity");
const store_1 = require("./lib/store");
// Define the entity plugin.
function entity(_options) {
    // const seneca = this
    return {
        // Define name, as tools like rollup will rename this function, breaking stuff.
        name: 'entity'
    };
}
entity.defaults = {
    map: {},
    mem_store: true,
    generate_id,
    pattern_fix: { sys: 'entity' },
    // Control stringification of entities
    jsonic: {
        depth: 7,
        maxitems: 11,
        maxchars: 111,
    },
    log: {
        active: false,
    },
    // hide: Open({}),
    meta: {
        // Provide action meta object as third argument to callbacks.
        provide: true,
    },
    ent: (0, gubu_1.Child)({
        valid: (0, gubu_1.Skip)((0, gubu_1.Any)()), // Gubu
        valid_json: (0, gubu_1.Skip)({}), // Gubu JSON
    })
};
// All functionality should be loaded when defining plugin
function preload(context) {
    var _a;
    const seneca = this;
    const options = context.options;
    seneca.util.parsecanon = seneca.util.parsecanon || make_entity_1.MakeEntity.parsecanon;
    // Create entity delegate.
    const sd = seneca.delegate();
    // Template entity that makes all others.
    seneca.private$.entity =
        seneca.private$.entity || (0, make_entity_1.MakeEntity)({}, sd, options);
    // Expose the Entity object so third-parties can do interesting things with it
    seneca.private$.exports.Entity =
        seneca.private$.exports.Entity || make_entity_1.Entity;
    function build_api_make(promise) {
        let entityAPI = function entityAPI() {
            let ent = seneca.private$.entity.make$(this, ...[...arguments, promise]);
            return ent;
        };
        return entityAPI;
    }
    let make = build_api_make(false);
    let entity = build_api_make(true);
    if (!seneca.make$) {
        seneca.decorate('make$', make);
    }
    if (!seneca.make) {
        seneca.decorate('make', make);
    }
    if (!seneca.entity) {
        seneca.decorate('entity', entity);
    }
    // Backwards compatibility
    seneca
        .translate('role:entity,cmd:load', 'sys:entity,role:null')
        .translate('role:entity,cmd:save', 'sys:entity,role:null')
        .translate('role:entity,cmd:list', 'sys:entity,role:null')
        .translate('role:entity,cmd:remove', 'sys:entity,role:null');
    const store = (0, store_1.Store)(options);
    if (options.mem_store) {
        seneca.root.use(require('seneca-mem-store'));
    }
    if ((_a = options.log) === null || _a === void 0 ? void 0 : _a.active) {
        seneca.root.private$.exports.Entity.prototype.log$ = function () {
            // Use this, as make$ will have changed seneca ref.
            const seneca = this.private$.get_instance();
            seneca.log.apply(seneca, arguments);
        };
    }
    (0, valid_1.buildValidation)(seneca, seneca.private$.entity, options);
    return {
        // Define name, as tools like rollup will rename this function, breaking stuff.
        name: 'entity',
        exports: {
            store: store,
            init: store.init,
            generate_id: options.generate_id.bind(seneca),
        }
    };
}
entity.preload = preload;
// cache nid funcs up to length 64
const nidCache = [];
function generate_id(msg, reply) {
    let seneca = this;
    let Nid = seneca.util.Nid;
    let actnid = null == msg ? Nid({}) : null;
    if (null == actnid) {
        const length = 'object' === typeof msg
            ? parseInt(msg.length, 10) || 6
            : parseInt(msg, 10);
        if (length < 65) {
            actnid = nidCache[length] || (nidCache[length] = Nid({ length: length }));
        }
        else {
            actnid = Nid({ length: length });
        }
    }
    return reply ? reply(actnid()) : actnid();
}
// Prevent name mangling
Object.defineProperty(entity, 'name', { value: 'entity' });
exports.default = entity;
if ('undefined' !== typeof (module)) {
    module.exports = entity;
}
//# sourceMappingURL=entity.js.map