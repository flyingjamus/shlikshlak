import { apiBuilder } from '@zodios/core'
import { z } from 'zod'

export type ApiFile = z.infer<typeof ApiFile>

const ApiFile = z.discriminatedUnion('exists', [
  z.object({
    exists: z.literal(true),
    contents: z.string().optional(),
    files: z
      .array(
        z.object({
          isFile: z.boolean(),
          isDirectory: z.boolean(),
          isSymlink: z.boolean(),
          name: z.string(),
        })
      )
      .optional(),
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
  .addEndpoint({
    method: 'post',
    path: '/launch_editor',
    alias: 'launchEditor',
    response: z.object({}),
    parameters: [
      {
        type: 'Body',
        name: 'body',
        schema: z.object({
          fileName: z.string(),
          lineNumber: z.number(),
          colNumber: z.number().optional(),
        }),
      },
    ],
  })
  .addEndpoint({
    method: 'get',
    path: '/init',
    alias: 'init',
    response: z.object({
      rootPath: z.string(),
    }),
    errors: [{ status: 400, schema: z.object({}) }],
  })
  .build()
