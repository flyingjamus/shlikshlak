import { Editor, loader, useMonaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

import '../../workers'
import { useEffect } from 'react'
import { SingleLineMonacoEditor } from './SingleLineMonacoEditor'

loader.config({ monaco })

export const Regular = () => {
  const monaco = useMonaco()

  useEffect(() => {
    monaco?.languages.typescript.javascriptDefaults.setEagerModelSync(true)
    if (monaco) {
      console.log('here is the monaco instance:', monaco)
    }
  }, [monaco])

  return <Editor height="90vh" defaultValue="// some comment" defaultLanguage="typescript" />
}

export const SingleLine = () => {
  return <SingleLineMonacoEditor />
}

