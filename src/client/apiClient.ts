import { Zodios } from '@zodios/core'
import { filesApi } from '../common/api'

export const apiClient = new Zodios('http://localhost:3001', filesApi)
