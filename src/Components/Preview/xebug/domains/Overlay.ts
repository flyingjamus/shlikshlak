import { $, h, isMobile, toNum, isStr, each, trim } from '../lib/util'
import { getNodeReactLocation, pushNodesToFrontend } from './DOM'
import connector from '../lib/connector'
import * as stringifyObj from '../lib/stringifyObj'
import { getNode, getNodeId } from '../lib/stringifyNode'
import { Protocol } from 'devtools-protocol/types/protocol'
import { parentConnection } from '../../../../StorybookFrame/Xebug'

type HighlightConfig = Protocol.Overlay.HighlightConfig
type HighlightNodeRequest = Protocol.Overlay.HighlightNodeRequest
type SetInspectModeRequest = Protocol.Overlay.SetInspectModeRequest

function rgba(
  r: number,
  g: number,
  b: number,
  a: number
): import('devtools-protocol').Protocol.DOM.RGBA | undefined {
  return { r, g, b, a }
}
const DEFAULT_HIGHTLIGHT_CONFIG: HighlightConfig = {
  borderColor: rgba(255, 229, 153, 0.66),
  contentColor: rgba(111, 168, 220, 0.66),
  cssGridColor: rgba(75, 0, 130, 1),
  eventTargetColor: rgba(255, 196, 196, 0.66),
  marginColor: rgba(246, 178, 107, 0.66),
  paddingColor: rgba(147, 196, 125, 0.55),
  shapeColor: rgba(96, 82, 117, 0.8),
  shapeMarginColor: rgba(96, 82, 127, 0.6),
}
export function highlightNode(params: Partial<HighlightNodeRequest>) {
  const { nodeId, highlightConfig, objectId } = params
  const { marginColor, paddingColor, borderColor, contentColor, showInfo } =
    highlightConfig || DEFAULT_HIGHTLIGHT_CONFIG

  let node: any
  if (nodeId) {
    node = getNode(nodeId)
  }
  if (objectId) {
    node = stringifyObj.getObj(+objectId)
  }

  if (node.nodeType === 3) {
    const range = document.createRange()
    range.selectNode(node)
    const { left, width, top, height } = range.getBoundingClientRect()
    range.detach()
    $container.css({ left, top, width, height }).show()
    $margin.css({ width: 0, height: 0 })
    $border.css({ width: 0, height: 0 })
    $padding.css({ width: 0, height: 0 })
    $content.css({
      left: 0,
      top: 0,
      width,
      height,
      background: toColor(contentColor),
    })
    if (showInfo) {
      $info
        .css({
          top: top < 25 ? 0 : -25,
          left: 0,
        })
        .html(`<span style="color:#881280;">#text</span> | ${Math.round(width)} × ${Math.round(height)}`)
        .show()
    } else {
      $info.hide()
    }
    return
  }

  if (node.nodeType !== 1) return

  const { left, width, top, height } = $(node).offset()
  $container.css({ left, top, width, height }).show()

  const computedStyle = window.getComputedStyle(node)
  const getNumStyle = (name: string) => pxToNum(computedStyle.getPropertyValue(name))

  const ml = getNumStyle('margin-left')
  const mr = getNumStyle('margin-right')
  const mt = getNumStyle('margin-top')
  const mb = getNumStyle('margin-bottom')

  const bl = getNumStyle('border-left-width')
  const br = getNumStyle('border-right-width')
  const bt = getNumStyle('border-top-width')
  const bb = getNumStyle('border-bottom-width')

  const pl = getNumStyle('padding-left')
  const pr = getNumStyle('padding-right')
  const pt = getNumStyle('padding-top')
  const pb = getNumStyle('padding-bottom')

  const pw = width - bl - br
  const ph = height - bt - bb

  const marginColorText = toColor(marginColor)
  $margin.css({
    left: -ml,
    top: -mt,
    width: width + ml + mr,
    height: height + mt + mb,
    borderTop: `${mt}px solid ${marginColorText}`,
    borderLeft: `${ml}px solid ${marginColorText}`,
    borderRight: `${mr}px solid ${marginColorText}`,
    borderBottom: `${mb}px solid ${marginColorText}`,
  })

  const borderColorText = toColor(borderColor)
  $border.css({
    left: 0,
    top: 0,
    width,
    height,
    borderTop: `${bt}px solid ${borderColorText}`,
    borderLeft: `${bl}px solid ${borderColorText}`,
    borderRight: `${br}px solid ${borderColorText}`,
    borderBottom: `${bb}px solid ${borderColorText}`,
  })

  const paddingColorText = toColor(paddingColor)
  $padding.css({
    left: bl,
    top: bt,
    width: pw,
    height: ph,
    borderTop: `${pt}px solid ${paddingColorText}`,
    borderLeft: `${pl}px solid ${paddingColorText}`,
    borderRight: `${pr}px solid ${paddingColorText}`,
    borderBottom: `${pb}px solid ${paddingColorText}`,
  })

  $content.css({
    left: bl + pl,
    top: bt + pt,
    width: pw - pl - pr,
    height: ph - pt - pb,
    background: toColor(contentColor),
  })

  if (showInfo) {
    $info
      .css({
        top: -mt - (top - mt < 25 ? 0 : 25),
        left: -ml,
      })
      .html(`${formatElName(node)} | ${Math.round(width)} × ${Math.round(height)}`)
      .show()
  } else {
    $info.hide()
  }
}

export function hideHighlight() {
  $container.hide()
}

let showViewportSizeOnResize = false
export function setShowViewportSizeOnResize(params: any) {
  showViewportSizeOnResize = params.show
}

let inspectMode: string = 'none'
export function setInspectMode(params: SetInspectModeRequest) {
  inspectMode = params.mode
}

function getElementFromPoint(e: any) {
  if (isMobile()) {
    const touch = e.touches[0] || e.changedTouches[0]
    return document.elementFromPoint(touch.pageX, touch.pageY)
  }

  return document.elementFromPoint(e.clientX, e.clientY)
}

function moveListener(e: any) {
  if (inspectMode === 'none') return

  const node = getElementFromPoint(e)
  if (!node) return
  let nodeId = getNodeId(node)

  if (!nodeId) {
    nodeId = pushNodesToFrontend(node)
  }

  highlightNode({ nodeId })

  connector.trigger('Overlay.nodeHighlightRequested', {
    nodeId,
  })
}

function outListener() {
  if (inspectMode === 'none') return

  hideHighlight()
}

function clickListener(e: any) {
  if (inspectMode === 'none') return

  e.preventDefault()
  e.stopImmediatePropagation()

  const node = getElementFromPoint(e)



  const nodeId = getNodeId(node)
  getNodeReactLocation(nodeId)
  parentConnection.Overlay.inspectNodeRequested({
    backendNodeId: nodeId,
  })

  hideHighlight()
}

function addEvent(type: string, listener: any) {
  document.documentElement.addEventListener(type, listener, true)
}
if (isMobile()) {
  addEvent('touchstart', moveListener)
  addEvent('touchmove', moveListener)
  addEvent('touchend', clickListener)
} else {
  addEvent('mousemove', moveListener)
  addEvent('mouseout', outListener)
  addEvent('click', clickListener)
}

const viewportSize = h('div', {
  class: '__chii-hide__',
  style: {
    position: 'fixed',
    right: 0,
    top: 0,
    background: '#fff',
    fontSize: 13,
    opacity: 0.5,
    padding: '4px 6px',
  },
})
const $viewportSize: any = $(viewportSize)

let viewportSizeTimer: any
window.addEventListener('resize', () => {
  if (!showViewportSizeOnResize) return

  $viewportSize.text(`${window.innerWidth}px × ${window.innerHeight}px`)
  if (viewportSizeTimer) {
    clearTimeout(viewportSizeTimer)
  } else {
    document.documentElement.appendChild(viewportSize)
  }
  viewportSizeTimer = setTimeout(() => {
    $viewportSize.remove()
    viewportSizeTimer = null
  }, 1000)
})

const container = h('div', {
  class: '__chii-hide__',
  style: {
    display: 'none',
    position: 'absolute',
    pointerEvents: 'none',
  },
})
const $container = $(container)
document.documentElement.appendChild(container)

const margin = createEl()
const $margin = $(margin)

const border = createEl()
const $border = $(border)

const padding = createEl()
const $padding = $(padding)

const content = createEl()
const $content = $(content)

const info = createEl({
  height: 25,
  lineHeight: 25,
  background: '#fff',
  color: '#222',
  fontSize: 12,
  padding: '0 5px',
  whiteSpace: 'nowrap',
  overflowX: 'hidden',
  boxShadow:
    '0 2px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 4px 0 rgba(0, 0, 0, 0.08), 0 3px 1px -2px rgba(0, 0, 0, 0.2)',
})
const $info = $(info)

function createEl(style: any = {}) {
  const el = h('div', {
    style: {
      position: 'absolute',
      boxSizing: 'border-box',
      zIndex: 100000,
      ...style,
    },
  })
  container.appendChild(el)
  return el
}

function pxToNum(str: string) {
  return toNum(str.replace('px', ''))
}

function toColor(obj: any) {
  obj.a = obj.a || 0
  const { r, g, b, a } = obj
  return `rgba(${r},${g},${b},${a})`
}

function formatElName(el: HTMLElement) {
  const { id, className } = el

  let ret = `<span style="color:#881280;">${el.tagName.toLowerCase()}</span>`

  if (id !== '') ret += `<span style="color:#1a1aa8;">#${id}</span>`

  let classes = ''
  if (isStr(className)) {
    each(className.split(/\s+/g), (val: string) => {
      if (trim(val) === '') return

      classes += `.${val}`
    })
  }

  ret += `<span style="color:#1a1aa8;">${classes}</span>`

  return ret
}
