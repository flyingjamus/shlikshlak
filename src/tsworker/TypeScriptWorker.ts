/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  factory,
  FileTextChanges,
  formatting,
  isJsxAttribute,
  isJsxElement,
  isJsxOpeningLikeElement,
  isJsxSpreadAttribute,
  isJsxText,
  Node,
  resolveModuleName,
  setParent,
  SymbolFlags,
  textChanges,
} from 'typescript'
import { BaseTypeScriptWorker } from './BaseTypeScriptWorker'
import { isDefined } from 'ts-is-defined'
import { MatcherContext, PANELS } from './Panels'
import { PanelsResponse } from '../Shared/PanelTypes'
import type { IRange } from 'monaco-editor-core'

export class TypeScriptWorker extends BaseTypeScriptWorker {
  getAliasedSymbolIfNecessary(symbol: Symbol) {
    if ((symbol.flags & SymbolFlags.Alias) !== 0) return this.checker.getAliasedSymbol(symbol)
    return symbol
  }

  getExport(moduleName: string, name: string) {
    const rootFileName = this.program.getRootFileNames()[0]
    const resolved = resolveModuleName(moduleName, rootFileName, this.getCompilationSettings(), this)
    if (!resolved.resolvedModule) throw new Error('Not found')
    const sourceFile = this.requireSourceFile(resolved.resolvedModule.resolvedFileName)

    const symbolAtLocation = this.checker.getSymbolAtLocation(sourceFile)!
    const exportsOfModule = this.checker.getExportsOfModule(
      this.getAliasedSymbolIfNecessary(symbolAtLocation)
    )
    const moduleExport = exportsOfModule.find((v) => v.name === name)!
    if (!moduleExport) throw new Error('Not found')

    const declaredTypeOfSymbol = this.checker.getDeclaredTypeOfSymbol(moduleExport)
    return declaredTypeOfSymbol
    return this.checker.getNonNullableType(declaredTypeOfSymbol)
  }

  setAttributeAtPosition(
    fileName: string,
    position: number,
    attrName: string,
    value?: string | boolean | undefined
  ): FileTextChanges[] | void {
    const sourceFile = this.requireSourceFile(fileName)
    const token = this.getTokenAtPosition(fileName, position)
    const name = factory.createIdentifier(attrName)

    return textChanges.ChangeTracker.with(
      {
        host: this,
        preferences: {},
        formatContext: formatting.getFormatContext({}, this),
      },
      (t) => {
        const initializerExpression =
          value !== undefined && value !== true
            ? factory.createJsxExpression(
                /*dotDotDotToken*/ undefined,
                factory.createStringLiteral(
                  value || '',
                  // /* isSingleQuote */ quotePreference === QuotePreference.Single TODO!!
                  false
                )
              )
            : undefined
        const tokenWithAttr = token?.parent.parent.parent
        if (!tokenWithAttr) {
          console.error('tokenWithAttr not found')
          return
        }
        const jsxAttributesNode =
          tokenWithAttr && isJsxOpeningLikeElement(tokenWithAttr)
            ? tokenWithAttr.attributes
            : isJsxOpeningLikeElement(token?.parent)
            ? token?.parent.attributes
            : undefined
        if (!jsxAttributesNode) {
          console.error('Attributes not found')
          return
        }
        const jsxNode = token.parent.parent.parent.parent
        const childrenNodes = isJsxElement(jsxNode) && jsxNode.children
        const existingToken = jsxAttributesNode?.properties.find((v) => v.name?.getText() === attrName)
        if (attrName === 'children') {
          if (childrenNodes) {
            if (childrenNodes.length === 1) {
              t.replaceNode(sourceFile, childrenNodes[0], factory.createIdentifier(value || ''))
            } else if (childrenNodes.length === 0) {
              t.insertNodeAt(sourceFile, childrenNodes.pos, factory.createIdentifier(value || ''), {})
            } else {
              console.error('Multiple children')
              return
            }
          } else {
            console.error('Children are not a JSX Element')
            return
          }
        } else if (existingToken && !isJsxSpreadAttribute(existingToken)) {
          const options = { prefix: existingToken.pos === existingToken.end ? ' ' : undefined }
          if (value !== undefined) {
            const updates = factory.updateJsxAttribute(existingToken, name, initializerExpression)
            t.replaceNode(sourceFile, existingToken, updates, options)
          } else {
            t.deleteNode(sourceFile, existingToken)
          }
        } else {
          const name = factory.createIdentifier(attrName)
          const jsxAttribute = factory.createJsxAttribute(name, initializerExpression)
          const hasSpreadAttribute = jsxAttributesNode.properties.some(isJsxSpreadAttribute)
          // formattingScanner requires the Identifier to have a context for scanning attributes with "-" (data-foo).
          setParent(name, jsxAttribute)
          const jsxAttributes = factory.createJsxAttributes(
            hasSpreadAttribute
              ? [jsxAttribute, ...jsxAttributesNode.properties]
              : [...jsxAttributesNode.properties, jsxAttribute]
          )
          const options = { prefix: jsxAttributesNode.pos === jsxAttributesNode.end ? ' ' : undefined }
          t.replaceNode(sourceFile, jsxAttributesNode, jsxAttributes, options)
        }
      }
    )
  }

  async getPanelsAtPosition(fileName: string, position: number): Promise<PanelsResponse> {
    const parent = this.getParentTokenAtPosition(fileName, position)
    if (parent) {
      const existingAttributes = parent.attributes.properties
        .map((attr) => {
          if (isJsxAttribute(attr)) {
            const initializerText = attr.initializer?.getText()
            let value
            if (initializerText?.[0] === '{') {
              if (initializerText?.[1] === '"') {
                value = initializerText?.slice(2, -2).replaceAll('\\"', '"')
              } else if (initializerText?.[1] === "'") {
                value = initializerText?.slice(2, -2).replaceAll("\\'", "'")
              } else {
                value = initializerText?.slice(2, -2)
              }
            } else {
              value = initializerText?.slice(1, -1)
            }
            return {
              name: attr.name.escapedText.toString(),
              value,
              hasInitializer: !!attr.initializer,
              location: {
                pos: attr.pos,
                end: attr.end,
              },
            }
          }
        })
        .filter(isDefined)
      const existingIncludingChildren = [
        ...existingAttributes,
        ...(isJsxElement(parent.parent)
          ? parent.parent.children.map((v) => {
              if (isJsxText(v))
                return {
                  name: 'children',
                  location: {
                    pos: v.pos,
                    end: v.end,
                  },
                  value: v.getText(),
                }
            })
          : []),
      ].filter(isDefined)
      const typeAtLocation = this.checker.getContextualType(parent.attributes)

      if (typeAtLocation) {
        // const sxPropsType = this.getExport('@mui/system', 'SystemCssProperties')
        const context: MatcherContext = {
          c: this.checker,
          w: this,
          // , types: { SxProps: sxPropsType }
        }
        const attributes = [...typeAtLocation.getProperties()].map((prop) => {
          const type = this.checker.getNonNullableType(this.checker.getTypeOfSymbol(prop))

          return {
            name: prop.name,
            location: existingIncludingChildren.find((v) => v.name === prop.name)?.location,
            panels: type
              ? PANELS.map((v) => {
                  return v.matcher(type, context)
                }).filter(isDefined)
              : [],
          }
        })

        return {
          attributes: [...attributes],
          existingAttributes: existingIncludingChildren,
          location: parent.attributes.pos,
          fileName,
          range: getRange(parent),
        }
      }
    }
    return { attributes: [], existingAttributes: [] }
  }
}

const getRange = (node: Node): IRange => {
  const sourceFile = node.getSourceFile()
  const { line: startLineNumber, character: startColumn } = sourceFile.getLineAndCharacterOfPosition(node.pos)
  const { line: endLineNumber, character: endColumn } = sourceFile.getLineAndCharacterOfPosition(node.end)
  return {
    startColumn: startColumn ? startColumn + 2 : startColumn,
    startLineNumber: startLineNumber + 1,
    endColumn: endColumn + 1,
    endLineNumber: endLineNumber + 1,
  }
}
