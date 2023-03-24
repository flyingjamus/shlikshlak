import { apiBuilder } from '@zodios/core'
import { z } from 'zod'
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
  value: z.union([z.string(), z.literal(true), z.undefined()]),
})
export type SetAttributesAtPositionRequest = z.infer<typeof SetAttributesAtPositionRequest>

export const WriteError = z.object({
  type: z.enum(['PRETTIER', 'TS']),
  fileName: z.string(),
  position: z.number().optional(),
  text: z.string(),
})
export type WriteError = z.infer<typeof WriteError>

export const textSpanSchema = z.object({
  start: z.number(),
  length: z.number(),
})

const textChangeSchema = z.object({
  span: textSpanSchema,
  newText: z.string(),
})

export const FileTextChanges = z.object({
  fileName: z.string(),
  textChanges: z.array(textChangeSchema),
  isNewFile: z.boolean().optional(),
})
export type FileTextChanges = z.infer<typeof FileTextChanges>

const ChangesOrError = z.object({ undoChanges: z.array(FileTextChanges).optional(), error: z.boolean() })
export const filesApi = apiBuilder({
  method: 'get',
  path: '/init',
  alias: 'init',
  response: z.object({
    rootPath: z.string(),
  }),
  errors: [{ status: 400, schema: z.object({}) }],
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
    response: ChangesOrError,
    parameters: [
      {
        type: 'Body',
        name: 'body',
        schema: SetAttributesAtPositionRequest,
      },
    ],
  })
  .addEndpoint({
    method: 'post',
    path: '/do_change',
    response: ChangesOrError,
    parameters: [
      {
        type: 'Body',
        name: 'body',
        schema: z.object({ changes: z.array(FileTextChanges) }),
      },
    ],
  })
  .build()
