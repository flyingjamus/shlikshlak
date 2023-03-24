import {
  isJsxExpression,
  isStringLiteral,
  JsxAttribute,
  Type,
  TypeChecker,
  UnionOrIntersectionType,
} from 'typescript'
import { PanelMatch, PanelMatchName } from '../../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'

export type MatcherContext = {
  c: TypeChecker
  types: Record<string, Type | undefined>
}

const flattenType = (type: Type): Type[] => {
  return type.isUnion() ? type.types.flatMap(flattenType) : [type]
}

function getEnumValues(type: UnionOrIntersectionType) {
  return type.types
    .map((v) => {
      if (v.isStringLiteral()) {
        return v.value
      }
    })
    .filter(isDefined)
}

export const PANELS: {
  matcher: (type: Type, context: MatcherContext) => PanelMatch | undefined
  reverseMatch: (attr: JsxAttribute, context: MatcherContext) => PanelMatchName | undefined
}[] = [
  // {
  //   matcher: (type, { c, types: { SxProps } }) => {
  //     if (flattenType(type).some((v) => v.aliasSymbol && SxProps && v.aliasSymbol === SxProps.aliasSymbol)) {
  //       return { name: 'SxProps' }
  //     }
  //   },
  // },
  {
    matcher: (type, { c }) => {
      if (type.isUnionOrIntersection()) {
        const values = getEnumValues(type)
        if (values.length) {
          values.sort()
          return {
            name: 'enum',
            parameters: { values },
          }
        }
      }
    },
    reverseMatch: (attr, { c }) => {
      if (!attr.initializer) return
      const type = c.getContextualType(attr.initializer)

      if (
        (isStringLiteral(attr.initializer) ||
          (isJsxExpression(attr.initializer) &&
            attr.initializer.expression &&
            isStringLiteral(attr.initializer.expression))) &&
        type &&
        type.isUnionOrIntersection() &&
        c.isTypeAssignableTo(type, c.getStringType())
      ) {
        return 'enum'
      }
    },
  },
  {
    matcher: (type, { c }) => {
      if (c.isTypeAssignableTo(c.getStringType(), type)) {
        return { name: 'string' }
      }
    },
    reverseMatch: (attr, { c }) => {
      if (!attr.initializer) return
      const type = c.getContextualType(attr.initializer)
      if (type && c.isTypeAssignableTo(c.getStringType(), type)) {
        return 'string'
      }
    },
  },
  {
    reverseMatch: (attr, { c }) => {
      if (!attr.initializer) return 'boolean'
      // TODO
    },
    matcher: (type, { c }) => {
      if (c.isTypeAssignableTo(c.getBooleanType(), type)) {
        return { name: 'boolean' }
      }
    },
  },
]
