/* Copyright (c) 2022-2026 Richard Rodger and other contributors, MIT License */

import { Patrun } from 'patrun'

import { Entity, MakeEntity } from './lib/make_entity'

// A shape is a function carrying a marker property: `shape` for shapes
// built by shape (Seneca 4), `gubu` for shapes built by Gubu (Seneca 3).
// Duck typing is used instead of `isShape`, which only recognizes shapes
// built by the same copy of the library. Shapes built by another copy or
// version must be used as they are: re-wrapping them fails validation
// with "the object is not of type function".
function isShape(v: any): boolean {
  return 'function' === typeof v && (null != v.shape || null != v.gubu)
}

// Builder nodes carry a marker in `$`: `shape$` or `gubu$`. A spec that
// holds nodes of the other library is not understood by the validator
// (every save fails), so the path of the first one is reported instead.
function findForeignNode(
  spec: any,
  marker: string,
  path: string = '',
  seen = new Set(),
): string | null {
  if (null == spec || 'object' !== typeof spec || seen.has(spec)) {
    return null
  }
  seen.add(spec)
  if (
    null != spec.$ &&
    'object' === typeof spec.$ &&
    Object.prototype.hasOwnProperty.call(spec.$, marker)
  ) {
    return path || '(root)'
  }
  for (const key of Object.keys(spec)) {
    const found = findForeignNode(
      spec[key],
      marker,
      path ? path + '.' + key : key,
      seen,
    )
    if (null != found) {
      return found
    }
  }
  return null
}

function buildValidation(seneca: any, entity: Entity, options: any) {
  const canonRouter = Patrun()

  // The validator of the Seneca instance: shape on Seneca 4, Gubu on
  // Seneca 3.
  const Valid = seneca.valid
  const isShapeLib = null != Valid({}).shape
  const foreignMarker = isShapeLib ? 'gubu$' : 'shape$'

  const canonMap = options.ent || {}

  const canons = Object.keys(canonMap)

  for (let cI = 0; cI < canons.length; cI++) {
    const cstr = canons[cI]
    const canon = MakeEntity.parsecanon(cstr)
    const spec = canonMap[cstr]

    let shape
    let vopts = { name: 'Entity: ' + cstr }

    if (spec.valid_json) {
      shape = Valid.build(spec.valid_json, vopts)
    } else if (spec.valid) {
      let valid = spec.valid

      // A plain function (not a shape) is a factory returning the spec.
      if ('function' === typeof valid && !isShape(valid)) {
        valid = valid()
      }

      if (!isShape(valid)) {
        const at = findForeignNode(valid, foreignMarker)
        if (null != at) {
          throw new Error(
            `Entity: ${cstr}: the valid option is built with ` +
              `${isShapeLib ? 'Gubu' : 'shape'} builders (at ${at}), but ` +
              `this Seneca validates with ${isShapeLib ? 'shape' : 'Gubu'}, ` +
              `which does not read them. Build the spec with seneca.valid.`,
          )
        }
      }

      shape = isShape(valid) ? valid : Valid(valid, vopts)
    }

    canonRouter.add(canon, {
      shape,
    })
  }

  ;(entity as any).canonRouter$ = canonRouter
}

export { buildValidation }
