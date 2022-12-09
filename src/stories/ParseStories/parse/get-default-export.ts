import { converter } from '../ast-to-obj.js'
import { ParsedStoriesResult } from '../types'
import { NodePath } from '@babel/traverse'
import { ExportDefaultDeclaration } from '@babel/types'

/**
 * @param {import('../../../shared/types').ParsedStoriesResult} result
 * @param {any} astPath
 */
const getDefaultExport = (result: ParsedStoriesResult, astPath: NodePath<ExportDefaultDeclaration>) => {
  if (!astPath) return
  try {
    let objNode = astPath.node.declaration
    if (
      astPath.node.declaration.type === 'Identifier' &&
      'init' in astPath.scope.bindings[astPath.node.declaration.name].path.node
    ) {
      objNode = astPath.scope.bindings[astPath.node.declaration.name].path.node.init
    }
    if (astPath.node.declaration.type === 'TSAsExpression') {
      objNode = astPath.node.declaration.expression
    }
    if ('properties' in objNode) {
      objNode.properties.forEach((/** @type {any} */ prop) => {
        if (prop.type === 'ObjectProperty' && prop.key.name === 'title') {
          if (prop.value.type !== 'StringLiteral') {
            throw new Error('Default title must be a string literal.')
          }
          result.exportDefaultProps.title = prop.value.value
        } else if (
          prop.type === 'ObjectProperty' &&
          prop.key.type === 'Identifier' &&
          prop.key.name === 'meta'
        ) {
          const obj = converter(prop.value)
          const json = JSON.stringify(obj)
          result.exportDefaultProps.meta = JSON.parse(json)
        }
      })
    }
  } catch (e) {
    throw new Error(
      `Can't parse the default title and meta of ${result.entry}. Meta must be serializable and title a string literal.`
    )
  }
}

export default getDefaultExport
