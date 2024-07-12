
import { Patrun } from 'patrun'
import { Gubu } from 'gubu'

import { Entity, MakeEntity } from './lib/make_entity'


function buildValidation(_seneca: any, entity: Entity, options: any) {
  // console.log('VALID OPTS')
  // console.dir(options, { depth: null })

  const canonRouter = Patrun()

  const canonMap = options.ent || {}

  const canons = Object.keys(canonMap)

  // console.log('canons', canons)

  for (let cI = 0; cI < canons.length; cI++) {
    const cstr = canons[cI]
    const canon = MakeEntity.parsecanon(cstr)
    const spec = canonMap[cstr]

    let shape
    let vopts = { name: 'Entity: ' + cstr }
    if (spec.valid_json) {
      shape = Gubu.build(spec.valid_json, vopts)
    }
    else if (spec.valid) {
      // let valid = ('function' === typeof spec.valid && !Gubu.isShape(spec.valid)) ?
      let valid = ('function' === typeof spec.valid && !spec.valid.gubu) ?
        spec.valid() : spec.valid

      shape = Gubu(valid, vopts)
      // console.log('SHAPE', shape.spec())
    }

    // console.log('add', canon, shape)

    canonRouter.add(canon, {
      shape
    })

  }

  // console.log('canonRouter:\n' + canonRouter)

  ; (entity as any).canonRouter$ = canonRouter
}


export {
  buildValidation
}
