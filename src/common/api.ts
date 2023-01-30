import { apiBuilder } from '@zodios/core'
import { z } from 'zod'
import { StoryEntry } from '../stories/ParseStories/types'
import { panelsResponseSchema } from '../Shared/PanelTypesZod'

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

export const StoryApiEntry = z.object({
  entry: z.string(),
  stories: z.array(
    z.object({
      storyId: z.string(),
      componentName: z.string(),
      namedExport: z.string(),
      locStart: z.number(),
      locEnd: z.number(),
    })
  ),

  exportDefaultProps: z.object({
    title: z.string().optional(),
    meta: z.any(),
  }),
  namedExportToMeta: z.record(z.any()),
  namedExportToStoryName: z.record(z.string()),
  storyParams: z.record(z.object({ title: z.string().optional(), meta: z.any() })),
  fileId: z.string(),
  storySource: z.string(),
})

export type StoryApiEntry = z.infer<typeof StoryApiEntry>

const location = z.object({
  fileName: z.string(),
  lineNumber: z.number(),
  colNumber: z.number().optional(),
})
export const SetAttributesAtPositionRequest = z.object({
  fileName: z.string(),
  position: z.number(),
  attrName: z.string(),
  value: z.union([z.string(), z.undefined()]),
})
export type SetAttributesAtPositionRequest = z.infer<typeof SetAttributesAtPositionRequest>

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
        schema: location,
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
  .addEndpoint({
    method: 'get',
    path: '/stories',
    response: z.object({
      stories: z.record(StoryApiEntry),
    }),
  })
  .addEndpoint({
    method: 'post',
    path: '/lang/getPanelsAtPosition',
    response: panelsResponseSchema,
    parameters: [
      {
        type: 'Body',
        name: 'body',
        schema: location,
      },
    ],
  })
  .addEndpoint({
    method: 'post',
    path: '/lang/setAttributeAtPosition',
    response: z.object({}),
    parameters: [
      {
        type: 'Body',
        name: 'body',
        schema: SetAttributesAtPositionRequest,
      },
    ],
  })
  .build()
