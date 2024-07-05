"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildValidation = buildValidation;
const patrun_1 = require("patrun");
const gubu_1 = require("gubu");
const make_entity_1 = require("./lib/make_entity");
function buildValidation(seneca, entity, options) {
    // console.log('VALID OPTS')
    // console.dir(options, { depth: null })
    const canonRouter = (0, patrun_1.Patrun)();
    const canonMap = options.ent || {};
    const canons = Object.keys(canonMap);
    // console.log('canons', canons)
    for (let cI = 0; cI < canons.length; cI++) {
        const cstr = canons[cI];
        const canon = make_entity_1.MakeEntity.parsecanon(cstr);
        const spec = canonMap[cstr];
        let shape;
        let vopts = { prefix: cstr };
        if (spec.valid_json) {
            shape = gubu_1.Gubu.build(spec.valid_json); // , vopts) // , { prefix: cstr })
        }
        else if (spec.valid) {
            // let valid = ('function' === typeof spec.valid && !Gubu.isShape(spec.valid)) ?
            let valid = ('function' === typeof spec.valid && !spec.valid.gubu) ?
                spec.valid() : spec.valid;
            // console.log('VALID', valid)
            shape = (0, gubu_1.Gubu)(valid, vopts);
            // console.log('SHAPE', shape.spec())
        }
        // console.log('add', canon, shape)
        canonRouter.add(canon, {
            shape
        });
    }
    //console.log('canonRouter:\n' + canonRouter)
    ;
    entity.canonRouter$ = canonRouter;
}
//# sourceMappingURL=valid.js.map