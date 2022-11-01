import 'react-mosaic-component/react-mosaic-component.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import { Mosaic } from 'react-mosaic-component'
import { Preview } from '../Preview/Preview'
import { Files } from '../Files/Files'
import { InspectorTree } from '../Inspector/InspectorTree'
import { EditorWrapper } from '../Editor/EditorWrapper'
// import { PropsEditor, PropsEditorWrapper } from '../PropsEditor/PropsEditor'
import { useFileStore } from '../store'
import { Inspector } from '../Inspector/Inspector'

const ELEMENT_MAP = {
  files: <Files />,
  preview: <Preview />,
  editor: <EditorWrapper />,
  inspector: <Inspector />,
  // inspector: <InspectorTree />,
  // props: <PropsEditorWrapper />,
} as const

export type ViewId = keyof typeof ELEMENT_MAP

export const Screen = () => {
  return (
    <Mosaic<ViewId>
      renderTile={(id, path) => ELEMENT_MAP[id]}
      initialValue={{
        direction: 'row',
        first: {
          // first: {
          //   first: 'files',
          //   second: 'editor',
          //   direction: 'row',
          // },
          first: 'editor',
          second: {
            first: 'inspector',
            second: 'files',
            direction: 'row',
          },
          direction: 'column',
        },
        second: 'preview',
        splitPercentage: 50,
      }}
    />
  )
}
