import { getEncodedStoryName, storyDelimiter, titleToFileId, kebabCase } from '../naming-utils.js'
import { ParsedStoriesResult } from '../types'
import { cloneDeep, merge } from 'lodash-es'
import { NodePath } from '@babel/traverse'
import { ExportNamedDeclaration } from '@babel/types'

const getNamedExports = (
  {
    fileId,
    exportDefaultProps,
    namedExportToMeta,
    namedExportToStoryName,
    storyParams,
    stories,
    entry,
  }: ParsedStoriesResult,
  astPath: NodePath<ExportNamedDeclaration>
) => {
  /**
   * @type {string}
   */
  let namedExport = ''
  const namedExportDeclaration = astPath.node.declaration
  if (namedExportDeclaration?.type === 'ClassDeclaration') {
    namedExport = namedExportDeclaration.id.name
  } else if (
    namedExportDeclaration?.type === 'VariableDeclaration' &&
    'name' in namedExportDeclaration.declarations[0].id
  ) {
    namedExport = namedExportDeclaration.declarations[0].id.name
  } else if (namedExportDeclaration?.type === 'FunctionDeclaration' && namedExportDeclaration.id) {
    namedExport = namedExportDeclaration.id.name
  } else {
    throw new Error(`Named export in ${entry} must be variable, class or function.`)
  }

  if (namedExport.includes('__')) {
    throw new Error(
      `Story named ${namedExport} can't contain "__". It's reserved for internal encoding. Please rename this export.`
    )
  }

  let storyNamespace = fileId
  if (exportDefaultProps && exportDefaultProps.title) {
    storyNamespace = titleToFileId(exportDefaultProps.title)
  }
  const storyName = namedExportToStoryName[namedExport] ? namedExportToStoryName[namedExport] : namedExport
  const storyId = `${kebabCase(storyNamespace)}${storyDelimiter}${storyDelimiter}${kebabCase(storyName)}`
  // attach default meta to each story
  if (exportDefaultProps && exportDefaultProps.meta) {
    storyParams[storyId] = exportDefaultProps
  }
  // add and merge story specific meta
  if (namedExportToMeta[namedExport]) {
    storyParams[storyId] = merge(cloneDeep(storyParams[storyId] || {}), {
      meta: namedExportToMeta[namedExport],
    })
  }
  const componentName = getEncodedStoryName(kebabCase(storyNamespace), kebabCase(storyName))
  stories.push({
    storyId,
    componentName,
    namedExport,
    locStart: namedExportDeclaration.loc?.start.line!,
    locEnd: namedExportDeclaration.loc?.end.line!,
  })
}

export default getNamedExports
