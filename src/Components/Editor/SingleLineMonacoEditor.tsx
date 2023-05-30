import { Editor, EditorProps, OnMount } from '@monaco-editor/react'
import { KeyCode } from 'monaco-editor'

export const SingleLineMonacoEditor = ({ onMount, options, ...props }: EditorProps) => {
  const handleEditorDidMount: OnMount = (getValue, editor) => {
    editor.editor.addEditorAction({
      id: 'enter-pressed',
      label: 'Enter Pressed',
      keybindings: [KeyCode.Enter],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: function (ed) {},
    })
    onMount?.(getValue, editor)
  }

  return (
    <Editor
      height="1em"
      defaultLanguage="typescript"
      onMount={handleEditorDidMount}
      options={{
        selectOnLineNumbers: true,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
        },
        scrollBeyondLastLine: false,
        extraEditorClassName: 'hideCursor',
        lineNumbers: 'off',
        folding: false,
        glyphMargin: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
        ...options,
      }}
      {...props}
    />
  )
}
