import {
  codefix,
  factory,
  FileTextChanges,
  formatting,
  isJsxOpeningLikeElement,
  textChanges,
} from 'typescript'
import ts from 'typescript'
import { BaseTypeScriptWorker } from './BaseTypeScriptWorker'
import { isDefined } from 'ts-is-defined'
import { PANELS } from './Panels'
import { PanelsResponse } from '../Shared/PanelTypes'

export class TypeScriptWorker extends BaseTypeScriptWorker {
  async setAttributeAtPosition(
    fileName: string,
    position: number,
    attrName: string,
    value?: string
  ): Promise<FileTextChanges[] | void> {
    const sourceFile = this.getSourceFile(fileName)!
    const token = this.getTokenAtPosition(fileName, position)
    // typescript.getQuotePreference()
    const name = factory.createIdentifier(attrName)

    const changes = textChanges.ChangeTracker.with(
      {
        host: this,
        preferences: {},
        formatContext: formatting.getFormatContext({}, this),
      },
      (t) => {
        const initializer =
          value !== undefined
            ? factory.createJsxExpression(
                /*dotDotDotToken*/ undefined,
                factory.createStringLiteral(
                  value,
                  // /* isSingleQuote */ quotePreference === QuotePreference.Single TODO!!
                  false
                )
              )
            : undefined
        const tokenWithAttr = token?.parent.parent.parent
        const jsxAttributesNode =
          tokenWithAttr && isJsxOpeningLikeElement(tokenWithAttr) ? tokenWithAttr.attributes : undefined
        if (!jsxAttributesNode) {
          console.error('Attributes not found')
          return
        }
        const existingToken = jsxAttributesNode?.properties.find((v) => v.name?.getText() === attrName)
        if (existingToken && !ts.isJsxSpreadAttribute(existingToken)) {
          const options = { prefix: existingToken.pos === existingToken.end ? ' ' : undefined }
          if (value !== undefined) {
            const updates = factory.updateJsxAttribute(existingToken, name, initializer)
            t.replaceNode(sourceFile, existingToken, updates, options)
          } else {
            t.deleteNode(sourceFile, existingToken)
          }
        } else {
          const hasSpreadAttribute = jsxAttributesNode.properties.some(ts.isJsxSpreadAttribute)
          const name = factory.createIdentifier(attrName)
          const jsxAttribute = factory.createJsxAttribute(name, initializer)
          // formattingScanner requires the Identifier to have a context for scanning attributes with "-" (data-foo).
          ts.setParent(name, jsxAttribute)
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
    return changes
  }

  async getPanelsAtPosition(fileName: string, position: number): Promise<PanelsResponse> {
    const checker = this.getTypeChecker()
    const parent = this.getParentTokenAtPosition(fileName, position)
    if (parent) {
      const existingAttributes = parent.attributes.properties
        .map((attr) => {
          if (ts.isJsxAttribute(attr)) {
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
      const typeAtLocation = checker.getContextualType(parent.attributes)
      if (typeAtLocation) {
        const attributes = typeAtLocation.getProperties().map((prop) => {
          const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, parent))
          return {
            name: prop.name,
            location: existingAttributes.find((v) => v.name === prop.name)?.location,
            panels: PANELS.map((v) => {
              return v.matcher(type, checker)
            }).filter(isDefined),
          }
        })

        return { attributes, existingAttributes, location: parent.attributes.pos, fileName }
      }
    }
    return { attributes: [], existingAttributes: [] }
  }
}
