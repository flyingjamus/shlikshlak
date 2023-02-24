import 'react-mosaic-component/react-mosaic-component.css'
import { Mosaic } from 'react-mosaic-component'
import { Preview } from '../Preview/Preview'
import { Files } from '../Files/Files'
import { EditorWrapper } from '../Editor/EditorWrapper'
import '../../workers'
// import { Inspector } from '../Inspector/Inspector'
import { PropsEditorWrapper } from '../PropsEditor/PropsEditor'
import { Box } from '@mui/material'
import { ElementsStack } from '../PropsEditor/ElementsStack'
import { TreeWrapper } from '../PropsEditor/TreeWrapper'

const ELEMENT_MAP = {
  files: <Files />,
  preview: <Preview />,
  editor: <EditorWrapper />,
  // inspector: <Inspector />,
  // inspector: <InspectorTree />,
  props: <PropsEditorWrapper />,
  // elements: <ElementsStack />,
  elements: <TreeWrapper />
} as const

export type ViewId = keyof typeof ELEMENT_MAP

export const Screen = () => {
  return (
    <Box
      sx={{ '.mosaic-root': { overflow: 'hidden' } }}
      component={Mosaic<ViewId>}
      renderTile={(id, path) => ELEMENT_MAP[id]}
      initialValue={{
        direction: 'row',
        first: 'elements',
        second: {
          first: 'props',
          second: 'preview',
          direction: 'row',
          splitPercentage: 20,
        },

        splitPercentage: 40,
      }}
    />
  )
}

export default Screen
