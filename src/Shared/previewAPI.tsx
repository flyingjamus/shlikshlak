import { Protocol } from 'devtools-protocol/types/protocol'
export type PreviewAPI = {
  setInspectMode(
    mode: Protocol.Overlay.InspectMode,
    highlightConfig: Protocol.Overlay.HighlightConfig
  ): Promise<void>


}
