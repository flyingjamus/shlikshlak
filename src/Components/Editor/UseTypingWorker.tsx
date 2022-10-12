// const extraLibs = new Map<string, { js: monaco.IDisposable; ts: monaco.IDisposable }>()
import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'

const extraLibs = new Map<
  string,
  {
    // js: any;
    ts: any
  }
>()
export const useTypingWorker = () => {
  const workerRef = useRef<Worker>()
  useEffect(() => {
    if (monaco) {
      const addTypings = ({ typings }: { typings: { [key: string]: string } }) => {
        Object.keys(typings).forEach((path) => {
          const extraLib = extraLibs.get(path)

          if (extraLib) {
            // extraLib.js.dispose()
            extraLib.ts.dispose()
          }

          // Monaco Uri parsing contains a bug which escapes characters unwantedly.
          // This causes package-names such as `@expo/vector-icons` to not work.
          // https://github.com/Microsoft/monaco-editor/issues/1375
          let uri = monaco.Uri.from({ scheme: 'file', path }).toString()
          if (path.includes('@')) {
            uri = uri.replace('%40', '@')
          }

          // console.log('Adding extra', uri)

          // const js = monaco.languages.typescript.javascriptDefaults.addExtraLib(typings[path], uri)
          const ts = monaco.languages.typescript.typescriptDefaults.addExtraLib(typings[path], uri)

          // monaco.editor.createModel(typings[path], undefined, monaco.Uri.from({ scheme: 'file', path }))

          extraLibs.set(path, {
            // js,
            // ts,
          })
        })
      }

      const worker = new Worker(new URL('../../typings.worker.tsx', import.meta.url), {
        type: 'module',
      })
      worker.addEventListener('message', ({ data }: any) => addTypings(data))
      workerRef.current = worker

      // worker.postMessage({ name: 'react', version: 'latest' })
      // worker.postMessage({ name: 'react-dom', version: 'latest' })
      // worker.postMessage({ name: '@emotion/styled', version: 'latest' })
      // worker.postMessage({ name: '@emotion/react', version: 'latest' })
      // worker.postMessage({ name: '@mui/material', version: 'latest' })

      return () => {
        worker.terminate()
      }
    }
  }, [monaco])
}
