import { useParams } from 'react-router-dom'
import { apiHooks } from '../client/apiClient'
import { ComponentType, useEffect, useState } from 'react'

export const SingleStory = () => {
  const { data } = apiHooks.useQuery('/stories')
  const { id } = useParams<{ id: string }>()
  const [Comp, setComp] = useState<ComponentType>()
  useEffect(() => {
    ;(async () => {
      if (!data?.stories) return
      for (const [k, file] of Object.entries(data.stories)) {
        for (const story of file.stories) {
          if (story.storyId !== id) continue
          const importPath = await import.meta.resolve?.('/' + k)
          const module = importPath && (await import(importPath))
          setComp(() => module[story.namedExport])
        }
      }
    })()
  }, [id, data])
  if (!Comp) return null
  return <Comp />
}

export default SingleStory
