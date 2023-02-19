import type Agent from '../../../backend/agent'
import Overlay from './Overlay'
const SHOW_DURATION = 2000
let timeoutID: NodeJS.Timeout | null = null
let overlay: Overlay | null = null
export function hideOverlay(agent: Agent) {
  if (window.document == null) {
    agent.emit('hideNativeHighlight')
    return
  }

  timeoutID = null

  if (overlay !== null) {
    overlay.remove()
    overlay = null
  }
}
export function showOverlay(
  elements: Array<HTMLElement> | null,
  componentName: string | null,
  agent: Agent,
  hideAfterTimeout: boolean
) {
  if (timeoutID !== null) {
    clearTimeout(timeoutID)
  }

  if (elements == null) {
    return
  }

  if (overlay === null) {
    overlay = new Overlay(agent)
  }

  overlay.inspect(elements, componentName)

  if (hideAfterTimeout) {
    timeoutID = setTimeout(() => hideOverlay(agent), SHOW_DURATION)
  }
}
