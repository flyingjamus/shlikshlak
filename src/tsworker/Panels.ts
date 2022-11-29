import * as typescript from 'typescript'
import { PanelMatch } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'

export const PANELS: { matcher: (type: typescript.Type, checker: TypeChecker) => PanelMatch | undefined }[] =
  [
    {
      matcher: (type: typescript.Type, checker: TypeChecker) => {
        if (checker.isTypeAssignableTo(checker.getStringType(), type)) {
          return { name: 'string' }
        }
      }
    },
    {
      matcher: (type: typescript.Type, checker: TypeChecker) => {
        if (checker.isTypeAssignableTo(checker.getBooleanType(), type)) {
          return { name: 'boolean' }
        }
      }
    },
    {
      matcher: (type, checker) => {
        if (type.isUnionOrIntersection()) {
          const values = type.types
            .map((v) => {
              if (v.isStringLiteral()) {
                return v.value
              }
            })
            .filter(isDefined)
          if (values.length) {
            values.sort()
            return {
              name: 'enum',
              parameters: { values }
            }
          }
        }
      }
    },
  ]

export type TypeChecker = typescript.TypeChecker & {
  isTypeAssignableTo: (source: typescript.Type, target: typescript.Type) => boolean
  getStringType: () => typescript.Type
  getBooleanType: () => typescript.Type
}
