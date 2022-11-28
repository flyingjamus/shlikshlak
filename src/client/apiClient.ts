import { Zodios } from '@zodios/core'
import { filesApi } from '../common/api'
import { ZodiosHooks } from '@zodios/react'

export const apiClient = new Zodios('http://localhost:3001', filesApi)

export const apiHooks = new ZodiosHooks('shlikshlak', apiClient)
