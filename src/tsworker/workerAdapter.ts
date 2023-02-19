import PQueue from 'p-queue'
import { apiClient } from '../client/apiClient'

const attributesQueues: Record<string, PQueue> = {}

type AttributeValue = string | true | undefined

export async function setAttribute(fileName: string, location: number, prop: string, value: AttributeValue) {
  attributesQueues[fileName] ||= new PQueue({ concurrency: 1 })
  const p = attributesQueues[fileName]
  p.clear()
  await p.add(async ({}) => {
    await apiClient.post('/lang/setAttributeAtPosition', {
      fileName,
      position: location,
      attrName: prop,
      value,
    })
  })
}
