import { Source } from '../ReactDevtools/react-devtools-shared/shared/ReactElementType'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../client/apiClient'

export function useGetPanelsQuery(openFile: Source | null | undefined) {
  return useQuery(['getPanelsAtPosition', openFile], () => {
    if (!openFile) return null
    const { columnNumber, lineNumber, fileName } = openFile
    return apiClient.post('/lang/getPanelsAtPosition', {
      fileName: fileName,
      lineNumber: +lineNumber,
      colNumber: +columnNumber,
    })
  })
}
