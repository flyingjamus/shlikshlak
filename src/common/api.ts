import { apiBuilder } from '@zodios/core'
import { z } from 'zod'

export type ApiFile = z.infer<typeof ApiFile>

const ApiFile = z.discriminatedUnion('exists', [
  z.object({
    exists: z.literal(true),
    contents: z.string().optional(),
    type: z.enum(['FILE', 'DIR']),
  }),
  z.object({
    exists: z.literal(false),
  }),
])

export const filesApi = apiBuilder({
  method: 'post',
  path: '/get_file',
  alias: 'getFile',
  parameters: [
    {
      type: 'Body',
      name: 'path',
      schema: z.object({
        path: z.string(),
      }),
    },
  ],
  response: ApiFile,
})
  .addEndpoint({
    method: 'post',
    path: '/write_file',
    alias: 'writeFile',
    response: z.object({}),
    parameters: [
      { type: 'Body', name: 'body', schema: z.object({ path: z.string(), contents: z.string() }) },
    ],
  })
  .build()
