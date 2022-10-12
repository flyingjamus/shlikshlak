import { each, map, trim, filter, contain } from './util'
import { Protocol } from 'devtools-protocol/types/protocol'

const nodes = new Map()
const nodeIds = new Map()
let id = 1

export function getOrCreateNodeId(node: any) {
  let nodeId = nodeIds.get(node)
  if (nodeId) return nodeId

  nodeId = id++
  nodeIds.set(node, nodeId)
  nodes.set(nodeId, node)

  return nodeId
}

export function clear() {
  nodes.clear()
  nodeIds.clear()
}

export function getNodeId(node: any) {
  return nodeIds.get(node)
}

const isElement = (node: Node): node is Element => {
  return node.nodeType === Node.ELEMENT_NODE
}

export function wrap(node: Node, { depth = 1 } = {}): Protocol.DOM.Node {
  const nodeId = getOrCreateNodeId(node)

  const ret: Protocol.DOM.Node = {
    nodeName: node.nodeName,
    nodeType: node.nodeType,
    localName: (isElement(node) && node.localName) || '',
    nodeValue: node.nodeValue || '',
    nodeId,
    backendNodeId: nodeId,
  }

  if (node.parentNode) {
    ret.parentId = getOrCreateNodeId(node.parentNode)
  }

  if (isElement(node) && node.attributes) {
    const attributes: string[] = []
    each(node.attributes, ({ name, value }: any) => attributes.push(name, value))
    ret.attributes = attributes
  }

  const childNodes = filterNodes(node.childNodes)
  ret.childNodeCount = childNodes.length
  const hasOneTextNode = ret.childNodeCount === 1 && childNodes[0].nodeType === 3
  if (depth > 0 || hasOneTextNode) {
    ret.children = getChildNodes(node, depth)
  }

  return ret
}

export function getChildNodes(node: any, depth: number) {
  const childNodes = filterNodes(node.childNodes)

  return map(childNodes, (node: any) => wrap(node, { depth: depth - 1 }))
}

export function getPreviousNode(node: any) {
  let previousNode = node.previousSibling
  if (!previousNode) return

  while (!isValidNode(previousNode) && previousNode.previousSibling) {
    previousNode = previousNode.previousSibling
  }
  if (previousNode && isValidNode(previousNode)) {
    return previousNode
  }
}

export function filterNodes(childNodes: NodeListOf<ChildNode>) {
  return filter(childNodes, (node: any) => isValidNode(node))
}

function isValidNode(node: Node) {
  if (node.nodeType === 1) {
    const className = (node as Element).getAttribute('class') || ''
    if (contain(className, '__chii-hide__')) return false
  }

  return !(node.nodeType === 3 && trim(node.nodeValue || '') === '')
}

export function getNode(nodeId: number) {
  return nodes.get(nodeId)
}
