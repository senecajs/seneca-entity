/* Copyright (c) 2022-2026 Richard Rodger and other contributors, MIT License */

import { Patrun } from 'patrun'
import { Gubu } from 'gubu'

import { Entity, MakeEntity } from './lib/make_entity'

// A Gubu shape is a function carrying a `gubu` marker property. Duck
// typing is used instead of `Gubu.isShape`, which only recognizes shapes
// built by the same copy of Gubu. Shapes built by another copy or version
// (for example `Seneca.util.Gubu`, Gubu 9 on Seneca 4) must be used as
// they are: re-wrapping them with `Gubu(shape)` fails validation with
// "the object is not of type function".
function isShape(v: any): boolean {
  return 'function' === typeof v && null != v.gubu
}

function buildValidation(_seneca: any, entity: Entity, options: any) {
  const canonRouter = Patrun()

  const canonMap = options.ent || {}

  const canons = Object.keys(canonMap)

  for (let cI = 0; cI < canons.length; cI++) {
    const cstr = canons[cI]
    const canon = MakeEntity.parsecanon(cstr)
    const spec = canonMap[cstr]

    let shape
    let vopts = { name: 'Entity: ' + cstr }

    if (spec.valid_json) {
      shape = Gubu.build(spec.valid_json, vopts)
    } else if (spec.valid) {
      let valid = spec.valid

      // A plain function (not a shape) is a factory returning the spec.
      if ('function' === typeof valid && !isShape(valid)) {
        valid = valid()
      }

      shape = isShape(valid) ? valid : Gubu(valid, vopts)
    }

    canonRouter.add(canon, {
      shape,
    })
  }

  ;(entity as any).canonRouter$ = canonRouter
}

export { buildValidation }
