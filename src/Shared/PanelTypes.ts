// export const PANEL_TYPES = ['string', 'enum', 'boolean'] as const
// export type PanelType = typeof PANEL_TYPES[number]
export type PanelMatch =
  | { name: 'string' }
  | { name: 'boolean' }
  | { name: 'enum'; parameters: { values: string[] } }
  | { name: 'SxProps' }
  | { name: 'Children' }

export type ExistingAttributeValueObject = { value: string; name: string }[]
export type ExistingAttributeValue = string | true
type Location = {
  pos: number
  end: number
}
export type ExistingAttribute = {
  name: string
  value?: ExistingAttributeValue
  hasInitializer?: boolean
  location: Location
}

export type PanelAttribute = {
  name: string
  location?: Location
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

export interface IRange {
  readonly startLineNumber: number
  readonly startColumn: number
  readonly endLineNumber: number
  readonly endColumn: number
}
