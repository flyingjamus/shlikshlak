import {
  $,
  concat,
  contain,
  createId,
  each,
  html,
  isEmpty,
  isNull,
  lowerCase,
  map,
  toArr,
  unique,
  xpath,
} from '../lib/util'
import connector from '../lib/connector'
import { setGlobal } from '../lib/evaluate'
import mutationObserver from '../lib/mutationObserver'
import * as stringifyObj from '../lib/stringifyObj'
import * as stringifyNode from '../lib/stringifyNode'
import { getNode, getNodeId } from '../lib/stringifyNode'
import Protocol from 'devtools-protocol'
import { parentConnection } from '../../../../StorybookFrame/Xebug'

type GetDocumentResponse = Protocol.DOM.GetDocumentResponse
type RequestChildNodesRequest = Protocol.DOM.RequestChildNodesRequest

export function collectClassNamesFromSubtree(params: any) {
  const node = getNode(params.nodeId)

  const classNames: string[] = []

  traverseNode(node, (node: any) => {
    if (node.nodeType !== 1) return
    const className = node.getAttribute('class')
    if (className) {
      const names = className.split(/\s+/)
      for (const name of names) classNames.push(name)
    }
  })

  return {
    classNames: unique(classNames),
  }
}

export function copyTo(params: any) {
  const { nodeId, targetNodeId } = params

  const node = getNode(nodeId)
  const targetNode = getNode(targetNodeId)

  const cloneNode = node.cloneNode(true)
  targetNode.appendChild(cloneNode)
}

export function enable() {
  mutationObserver.observe()
  stringifyNode.clear()
}

export function getDocument(): GetDocumentResponse {
  return {
    root: stringifyNode.wrap(document, {
      depth: 2,
    }),
  }
}

export function getOuterHTML(params: any) {
  const node = getNode(params.nodeId)

  return {
    outerHTML: node.outerHTML,
  }
}

export function moveTo(params: any) {
  const { nodeId, targetNodeId } = params

  const node = getNode(nodeId)
  const targetNode = getNode(targetNodeId)

  targetNode.appendChild(node)
}

const searchResults = new Map()

export function performSearch(params: any) {
  const query = lowerCase(params.query)
  let result: any[] = []

  try {
    result = concat(result, toArr(document.querySelectorAll(query)))
  } catch (e) {
    /* tslint:disable-next-line */
  }
  try {
    result = concat(result, xpath(query))
  } catch (e) {
    /* tslint:disable-next-line */
  }
  traverseNode(document, (node: any) => {
    const { nodeType } = node
    if (nodeType === 1) {
      const localName = node.localName
      if (contain(`<${localName} `, query) || contain(`</${localName}>`, query)) {
        result.push(node)
        return
      }

      const attributes: string[] = []
      each(node.attributes, ({ name, value }: any) => attributes.push(name, value))
      for (let i = 0, len = attributes.length; i < len; i++) {
        if (contain(lowerCase(attributes[i]), query)) {
          result.push(node)
          break
        }
      }
    } else if (nodeType === 3) {
      if (contain(lowerCase(node.nodeValue), query)) {
        result.push(node)
      }
    }
  })

  const searchId = createId()
  searchResults.set(searchId, result)

  return {
    searchId,
    resultCount: result.length,
  }
}

export function getSearchResults(params: any) {
  const { searchId, fromIndex, toIndex } = params

  const searchResult = searchResults.get(searchId)
  const result = searchResult.slice(fromIndex, toIndex)
  const nodeIds = map(result, (node: any) => {
    const nodeId = getNodeId(node)

    if (!nodeId) {
      return pushNodesToFrontend(node)
    }

    return nodeId
  })

  return {
    nodeIds,
  }
}

// Make sure all parent nodes has been retrieved.
export function pushNodesToFrontend(node: any) {
  const nodes = [node]
  let parentNode = node.parentNode
  while (parentNode) {
    nodes.push(parentNode)
    const nodeId = getNodeId(parentNode)
    if (nodeId) {
      break
    } else {
      parentNode = parentNode.parentNode
    }
  }
  while (nodes.length) {
    const node = nodes.pop()
    const nodeId = getNodeId(node)
    connector.trigger('DOM.setChildNodes', {
      parentId: nodeId,
      nodes: stringifyNode.getChildNodes(node, 1),
    })
  }

  return getNodeId(node)
}

export function discardSearchResults(params: any) {
  searchResults.delete(params.searchId)
}

export function pushNodesByBackendIdsToFrontend(params: any) {
  return {
    nodeIds: params.backendNodeIds,
  }
}

export function removeNode(params: any) {
  const node = getNode(params.nodeId)

  $(node).remove()
}

export async function requestChildNodes({ depth = 1, nodeId }: RequestChildNodesRequest) {
  const node = getNode(nodeId)

  await parentConnection.DOM.setChildNodes({
    parentId: nodeId,
    nodes: stringifyNode.getChildNodes(node, depth),
  })
}

export function requestNode(params: any) {
  const node = stringifyObj.getObj(params.objectId)

  return {
    nodeId: getNodeId(node),
  }
}

export function resolveNode(params: any) {
  const node = getNode(params.nodeId)

  return {
    object: stringifyObj.wrap(node),
  }
}

export function setAttributesAsText(params: any) {
  const { name, text, nodeId } = params

  const node = getNode(nodeId)
  if (name) {
    node.removeAttribute(name)
  }
  $(node).attr(parseAttributes(text))
}

export function setAttributeValue(params: any) {
  const { nodeId, name, value } = params
  const node = getNode(nodeId)
  node.setAttribute(name, value)
}

const history: any[] = []

export function setInspectedNode(params: any) {
  const node = getNode(params.nodeId)
  history.unshift(node)
  if (history.length > 5) history.pop()
  for (let i = 0; i < 5; i++) {
    setGlobal(`$${i}`, history[i])
  }
}

export function setNodeValue(params: any) {
  const { nodeId, value } = params
  const node = getNode(nodeId)
  node.nodeValue = value
}

export function setOuterHTML(params: any) {
  const { nodeId, outerHTML } = params

  const node = getNode(nodeId)
  node.outerHTML = outerHTML
}

function parseAttributes(str: string) {
  str = `<div ${str}></div>`

  return html.parse(str)[0].attrs
}

function traverseNode(node: any, cb: Function) {
  const childNodes = stringifyNode.filterNodes(node.childNodes)
  for (let i = 0, len = childNodes.length; i < len; i++) {
    const child = childNodes[i]
    cb(child)
    traverseNode(child, cb)
  }
}

mutationObserver.on('attributes', (target: any, name: string) => {
  const nodeId = getNodeId(target)
  if (!nodeId) return

  const value = target.getAttribute(name)

  if (isNull(value)) {
    connector.trigger('DOM.attributeRemoved', {
      nodeId,
      name,
    })
  } else {
    connector.trigger('DOM.attributeModified', {
      nodeId,
      name,
      value,
    })
  }
})

mutationObserver.on('childList', (target: Node, addedNodes: NodeList, removedNodes: NodeList) => {
  const parentNodeId = getNodeId(target)
  if (!parentNodeId) return

  function childNodeCountUpdated() {
    connector.trigger('DOM.childNodeCountUpdated', {
      childNodeCount: stringifyNode.wrap(target, {
        depth: 0,
      }).childNodeCount,
      nodeId: parentNodeId,
    })
  }

  if (!isEmpty(addedNodes)) {
    childNodeCountUpdated()
    for (let i = 0, len = addedNodes.length; i < len; i++) {
      const node = addedNodes[i]
      const previousNode = stringifyNode.getPreviousNode(node)
      const previousNodeId = previousNode ? getNodeId(previousNode) : 0
      const params: any = {
        node: stringifyNode.wrap(node, {
          depth: 0,
        }),
        parentNodeId,
        previousNodeId,
      }

      parentConnection.DOM.childNodeInserted(params)
      // connector.trigger('DOM.childNodeInserted', params)
    }
  }

  if (!isEmpty(removedNodes)) {
    for (let i = 0, len = removedNodes.length; i < len; i++) {
      const node = removedNodes[i]
      const nodeId = getNodeId(node)
      if (!nodeId) {
        childNodeCountUpdated()
        break
      }
      connector.trigger('DOM.childNodeRemoved', {
        nodeId: getNodeId(node),
        parentNodeId,
      })
    }
  }
})

mutationObserver.on('characterData', (target: Node) => {
  const nodeId = getNodeId(target)
  if (!nodeId) return

  connector.trigger('DOM.characterDataModified', {
    characterData: target.nodeValue,
    nodeId,
  })
})
