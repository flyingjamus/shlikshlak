import 'react-mosaic-component/react-mosaic-component.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import { Mosaic } from 'react-mosaic-component'
import { Preview } from '../Preview/Preview'
import { Files } from '../Files/Files'
import { EditorWrapper } from '../Editor/EditorWrapper'
import '../../workers'
import { Inspector } from '../Inspector/Inspector'
import { PropsEditorWrapper } from '../PropsEditor/PropsEditor'

const ELEMENT_MAP = {
  files: <Files />,
  preview: <Preview />,
  editor: <EditorWrapper />,
  inspector: <Inspector />,
  // inspector: <InspectorTree />,
  props: <PropsEditorWrapper />,
} as const

export type ViewId = keyof typeof ELEMENT_MAP

export const Screen = () => {
  return (
    <Mosaic<ViewId>
      renderTile={(id, path) => ELEMENT_MAP[id]}
      initialValue={{
        direction: 'row',
        first: 'editor',
        second: {
          first: 'preview',
          second: 'props',
          direction: 'row',
          splitPercentage: 70,
        },

        splitPercentage: 50,
      }}
    />
  )
}

export default Screen
