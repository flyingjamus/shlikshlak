import { FilesMap, useFileStore } from '../store'
import TreeView from '@mui/lab/TreeView'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TreeItem from '@mui/lab/TreeItem'
import { uniq } from 'lodash-es'

export const splitToFilesAndDirectories = (
  prefixedPath: string,
  filesMap: FilesMap
): { directories: string[]; files: string[] } => {
  const paths = Object.keys(filesMap)
    .filter((filePath) => filePath.startsWith(prefixedPath))
    .map((file) => file.slice(prefixedPath.length))

  const files = paths.filter((file) => !file.includes('/')).map((file) => `${prefixedPath}${file}`)

  const directories = uniq(
    paths.filter((file) => file.includes('/')).map((file) => `${prefixedPath}${file.split('/')[0]}`)
  )

  return {
    directories: directories,
    files,
  }
}

const FilesTreeItemList = ({ prefixedPath, filesMap }: { prefixedPath: string; filesMap: FilesMap }) => {
  const { directories, files } = splitToFilesAndDirectories(prefixedPath, filesMap)
  return (
    <>
      {directories.map((dir) => (
        <TreeItem key={dir} nodeId={dir} label={dir.slice(prefixedPath.length)}>
          <FilesTreeItemList filesMap={filesMap} prefixedPath={dir + '/'} />
        </TreeItem>
      ))}
      {files.map((dir) => (
        <TreeItem
          key={dir}
          nodeId={dir}
          label={dir.slice(prefixedPath.length)}
          onClick={() => {
            useFileStore.setState({ openFile: dir })
          }}
        />
      ))}
    </>
  )
}

export const FileTree = () => {
  const filesMap = useFileStore((v) => v.files)
  const openFile = useFileStore((v) => v.openFile)
  if (!filesMap) return null

  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      <FilesTreeItemList filesMap={filesMap} prefixedPath={'/'} />
    </TreeView>
  )
}
