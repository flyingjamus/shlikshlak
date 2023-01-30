import {
  isTypeReferenceNode,
  isUnionTypeNode,
  NodeBuilderFlags,
  Type,
  TypeChecker,
  TypeNode,
} from 'typescript'
import { PanelMatch } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'

export type MatcherContext = {
  c: TypeChecker
  types: Record<string, Type>
}

const flattenType = (type: Type): Type[] => {
  return type.isUnion() ? type.types.flatMap(flattenType) : [type]
}

export const PANELS: {
  matcher: (type: Type, context: MatcherContext) => PanelMatch | undefined
}[] = [
  {
    matcher: (type, { c, types: { SxProps } }) => {
      if (flattenType(type).some((v) => v.aliasSymbol && SxProps && v.aliasSymbol === SxProps.aliasSymbol)) {
        return { name: 'SxProps' }
      }
    },
  },
  {
    matcher: (type, { c }) => {
      if (c.isTypeAssignableTo(c.getStringType(), type)) {
        return { name: 'string' }
      }
    },
  },
  {
    matcher: (type, { c }) => {
      if (c.isTypeAssignableTo(c.getBooleanType(), type)) {
        return { name: 'boolean' }
      }
    },
  },
  {
    matcher: (type, { c }) => {
      if (c.isTypeAssignableTo(c.getBooleanType(), type)) {
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
              parameters: { values },
            }
          }
        }
      }
    },
  },
]
