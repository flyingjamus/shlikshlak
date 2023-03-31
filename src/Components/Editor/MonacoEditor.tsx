import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Box } from '@mui/material'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useFileStore } from '../store'
import { getFileText } from '../../tsworker/fileGetter'
import { MONACO_OPTIONS } from './MONACO_OPTIONS'
// @ts-ignore
import { initVimMode } from 'monaco-vim'
import '../../workers'

export const MonacoEditor = forwardRef<editor.IStandaloneCodeEditor | null, {

}>((props, ref) => {
  const elRef = useRef<HTMLDivElement>()
  const statusBarRef = useRef<HTMLDivElement>()
  const [instance, setInstance] = useState<editor.IStandaloneCodeEditor>()
  useEffect(() => {
    const el = elRef.current
    if (!el) throw new Error('Missing ref')
    const instance = monaco.editor.create(el, MONACO_OPTIONS)
    setInstance(instance)

    // const disposers = [initVimMode(instance, statusBarRef.current)]

    return () => {
      instance.dispose()
      // disposers.forEach((v) => v.dispose())
    }
  }, [])
  useImperativeHandle(
    ref,
    () => {
      return instance as any
    },
    [instance]
  )

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box ref={elRef} sx={{ height: '100%', '.Highlighted': { background: 'rgba(2,2,2,0.05)' } }} />
      <Box ref={statusBarRef} />
    </Box>
  )
})

export default MonacoEditor
