import type { TextRange } from 'typescript'

export const PANEL_TYPES = ['string', 'enum', 'boolean'] as const
export type PanelType = typeof PANEL_TYPES[number]
export type PanelMatch =
  | { name: 'string' }
  | { name: 'boolean' }
  | { name: 'enum'; parameters: { values: string[] } }

export type PanelsResponse = {
  attributes: {
    name: string
    location?: TextRange
    required?: boolean
    panels: PanelMatch[]
  }[]
  existingAttributes: { name: string; value?: string; location: TextRange }[]
  location?: number
  fileName?: string
}
