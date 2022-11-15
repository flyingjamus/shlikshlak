import S from 'subsecond'
import globby from 'globby'
import { promises } from 'fs'
const { readFile, writeFile } = promises
const paths = await globby(['node_modules/@mui/**/*.d.ts'])

import { Node, Project, ScriptTarget } from 'ts-morph'

const project = new Project({
  skipAddingFilesFromTsConfig: true,
})
// project.addSourceFilesAtPaths('node_modules/@mui/**/*.d.ts')
// project
//   .getSourceFiles()
//   .map((file) =>
//     file
//       .getExportedDeclarations()
//       .get('Box')
//       ?.map((v) => {
//         console.log(
//           12123123,
//           v.getSourceFile().getBaseName(),
//           file.getImportDeclarations().map((v) => v.getText())
//         )
//         return Node.isReferenceFindable(v) && v.findReferences()
//       })
//   )
//   .filter(Boolean)

// const paths = await globby(['1/*.d.ts'])



import analyzeTsConfig from 'ts-unused-exports';
analyzeTsConfig()

// noinspection TypeScriptUnresolvedFunction
// const map = new Map<string, string>()
// for (const path of paths) {
//   map.set(path, await readFile(path, 'utf8'))
// }
//
// const files = Object.fromEntries(map.entries())
//
// S.load(files)
//
// noinspection TypeScriptUnresolvedFunction
// const changedFilenames = new Set<string>()
// S('TSTypeAliasDeclaration TSMappedType').each((v) => {
//   // console.log(v.fileName())
//   // console.log(111111, v.children().eq(1).text())
//   // console.log(
//   //   113231,
//   //   v.find('TSTypeParameter').text(),
//   //   111111,
//   //   v.find('TSTypeParameter').children().eq(1).text(),
//   //   111111,
//   //   v.find('TSQualifiedName').text()
//   // )
//   const constraint = v.children().eq(1)
//   const alias = v.find('TSTypeParameter').children().eq(0).text()
//   const references = v.find('TSTypeReference').filter((v) => v.text() === alias)
//   if (references.length) return
//   changedFilenames.add(v.fileName())
//
//   console.log(v.fileName(), '\n')
//
//   console.log(v.parent().text())
//   v.text(`Record<${v.find('TSTypeParameter').children().eq(1).text()}, ${constraint.text()}>`)
//   console.log(v.parent().text())
//   console.log('\n---------\n\n')
// })
//
// const newFiles = S.print()
//
// for (const filename of changedFilenames) {
//   console.log(filename)
//   // await writeFile(filename, newFiles[filename])
// }
// console.log(changedFilenames.values())
