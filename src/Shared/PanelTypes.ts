export const PANEL_TYPES = ['string', 'enum', 'boolean'] as const
export type PANEL_TYPE = typeof PANEL_TYPES[number]
export type PanelMatch = { name: PANEL_TYPE; parameters?: { values?: string[] } }
export type PanelsResponse = {
  attributes: { name: string; panels: PanelMatch[] }[]
  existingAttributes: { name: string; value?: string }[]
}
