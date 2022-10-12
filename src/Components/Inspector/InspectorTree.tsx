import { useIframeStore } from '../store'
import TreeView from '@mui/lab/TreeView'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TreeItem from '@mui/lab/TreeItem'
import { Box, IconButton } from '@mui/material'
import { chunk } from 'lodash-es'
import { useState } from 'react'
import Search from '@mui/icons-material/Search'

const ElementsTreeItemList = ({ nodeId }: { nodeId: number }) => {
  const childConnection = useIframeStore((v) => v.childConnection)
  const node = useIframeStore((v) => v.nodesMap?.get(+nodeId))
  if (!node) return null

  const label =
    `<${node.localName || node.nodeName}` +
    (node.attributes?.length
      ? ' ' +
        chunk(node.attributes, 2)
          .map(([k, v]) => k + '=' + v)
          .join(' ')
      : '') +
    '>'
  return (
    <TreeItem
      nodeId={node.nodeId.toString()}
      label={label}
      onMouseOver={(event) => {
        event.stopPropagation()
        childConnection?.Overlay.highlightNode({ nodeId: node.nodeId })
      }}
    >
      {node.children?.map((child) => (
        <ElementsTreeItemList key={child.nodeId} nodeId={child.nodeId} />
      ))}
    </TreeItem>
  )
}

export const InspectorTree = () => {
  const rootNode = useIframeStore((v) => v.rootNode)
  const childConnection = useIframeStore((v) => v.childConnection)
  const expandedIds = useIframeStore((v) => v.expandedIds)
  const [inspecting, setInspecting] = useState(false)

  if (!rootNode || !childConnection) return null
  return (
    <Box sx={{ background: 'white', overflow: 'auto' }}>
      <IconButton
        color={inspecting ? 'primary' : 'default'}
        onClick={() => {
          setInspecting((v) => !v)
          childConnection?.Overlay.setInspectMode({ mode: inspecting ? 'none' : 'searchForNode' })
        }}
      >
        <Search />
      </IconButton>
      <TreeView
        multiSelect={false}
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expandedIds}
        onNodeToggle={(event, nodeIds) => {
          useIframeStore.setState({ expandedIds: nodeIds })
        }}
        onNodeSelect={(e, nodeIds) => {}}
        // onNodeSelect={}
      >
        <ElementsTreeItemList nodeId={rootNode.nodeId} />
      </TreeView>
    </Box>
  )
}
