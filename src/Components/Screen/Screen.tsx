import 'react-mosaic-component/react-mosaic-component.css'
import { Mosaic } from 'react-mosaic-component'
import { Preview } from '../Preview/Preview'
import { Files } from '../Files/Files'
import { EditorWrapper } from '../Editor/EditorWrapper'
import '../../workers'
// import { Inspector } from '../Inspector/Inspector'
import { PropsEditorWrapper } from '../PropsEditor/PropsEditor'
import { Box } from '@mui/material'
import { TreeWrapper } from '../PropsEditor/TreeWrapper'
import { Errors } from '../Errors/Errors'
import { BottomTabs } from '../BottomTabs/BottomTabs'

const ELEMENT_MAP = {
  files: <Files />,
  preview: <Preview />,
  editor: <EditorWrapper />,
  props: <PropsEditorWrapper />,
  elements: <TreeWrapper />,
  errors: <Errors />,
  bottomTabs: <BottomTabs />,
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
        first: {
          first: { first: 'elements', second: 'props', direction: 'row', splitPercentage: 50 },
          second: 'bottomTabs',
          direction: 'column',
          splitPercentage: 50,
        },
        second: 'preview',
        splitPercentage: 50,
      }}
    />
  )
}

export default Screen
