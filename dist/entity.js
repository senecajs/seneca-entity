"use strict";
/* Copyright (c) 2010-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const valid_1 = require("./valid");
const make_entity_1 = require("./lib/make_entity");
const store_1 = require("./lib/store");
// Define the entity plugin.
function entity(_options) {
    // const seneca = this
    var _a;
    // An error thrown by preload stops it before the exports are set, and
    // mem-store, which it loads, then fails first with a misleading error.
    // So the error preload finds (a validation spec that cannot be read) is
    // thrown here, and Seneca reports it as plugin_define_failed.
    const preloadError = (_a = this.private$.entity) === null || _a === void 0 ? void 0 : _a.preloadError$;
    if (preloadError) {
        throw preloadError;
    }
    return {
        // Define name, as tools like rollup will rename this function, breaking stuff.
        name: 'entity'
    };
}
// The option shape is built with the builders Seneca passes in `valid`:
// shape on Seneca 4, Gubu on Seneca 3. Seneca 4 rejects Gubu shapes.
entity.defaults = ({ valid }) => ({
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
    // Fail if entity canon does not match an entry in ent option.
    strict: false,
    // Entity specific options. Use entity canon string (zone/base/name) for key.
    ent: valid.Child({
        valid: valid.Skip(valid.Any()), // Shape, or a shape spec
        valid_json: valid.Skip({}), // Shape spec as JSON
    })
});
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
        seneca.root.use(require('@seneca/mem-store'));
    }
    if ((_a = options.log) === null || _a === void 0 ? void 0 : _a.active) {
        seneca.root.private$.exports.Entity.prototype.log$ = function () {
            // Use this, as make$ will have changed seneca ref.
            const seneca = this.private$.get_instance();
            seneca.log.apply(seneca, arguments);
        };
    }
    seneca.private$.entity.preloadError$ = undefined;
    try {
        (0, valid_1.buildValidation)(seneca, seneca.private$.entity, options);
    }
    catch (err) {
        seneca.private$.entity.preloadError$ = err;
    }
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