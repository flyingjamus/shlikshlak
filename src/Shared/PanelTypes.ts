import type { TextRange } from 'typescript'
import type { IRange } from 'monaco-editor-core'

export const PANEL_TYPES = ['string', 'enum', 'boolean'] as const
export type PanelType = typeof PANEL_TYPES[number]
export type PanelMatch =
  | { name: 'string' }
  | { name: 'boolean' }
  | { name: 'enum'; parameters: { values: string[] } }
  | { name: 'SxProps' }


export type ExistingAttributeValueObject = { value: string; name: string }[]
export type ExistingAttributeValue = string | ExistingAttributeValueObject
export type ExistingAttribute = {
  name: string
  value?: ExistingAttributeValue
  location: TextRange
}

export type PanelAttribute = {
  name: string
  location?: TextRange
  required?: boolean
  panels: PanelMatch[]
}
export type PanelsResponse = {
  attributes: PanelAttribute[]
  existingAttributes: ExistingAttribute[]
  location?: number
  fileName?: string
  range?: IRange
}
