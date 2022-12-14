import { FileSystemHost, RuntimeDirEntry } from 'ts-morph'
import { TypeScriptWorker } from './TypeScriptWorker'

export class MyFileSystemHost implements FileSystemHost {
  constructor(private tsWorker: TypeScriptWorker) {}

  copy(srcPath: string, destPath: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  copySync(srcPath: string, destPath: string): void {}

  delete(path: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  deleteSync(path: string): void {}

  async directoryExists(dirPath: string): Promise<boolean> {
    return this.tsWorker.directoryExists(dirPath)
  }

  directoryExistsSync(dirPath: string): boolean {
    return this.tsWorker.directoryExists(dirPath)
  }

  async fileExists(filePath: string): Promise<boolean> {
    return this.tsWorker.fileExists(filePath)
  }

  fileExistsSync(filePath: string): boolean {
    return this.tsWorker.fileExists(filePath)
  }

  getCurrentDirectory(): string {
    return '/'
  }

  glob(patterns: ReadonlyArray<string>): Promise<string[]> {
    return Promise.resolve([])
  }

  globSync(patterns: ReadonlyArray<string>): string[] {
    return []
  }

  isCaseSensitive(): boolean {
    return false
  }

  mkdir(dirPath: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  mkdirSync(dirPath: string): void {}

  move(srcPath: string, destPath: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  moveSync(srcPath: string, destPath: string): void {}

  readDirSync(dirPath: string): RuntimeDirEntry[] {
    const file = this.tsWorker.getFile(dirPath)
    if (file.exists && file.type === 'DIR' && file.files) {
      return file.files
    }
    return []
  }

  async readFile(filePath: string, encoding?: string): Promise<string> {
    return this.tsWorker.readFile(filePath) || ''
  }

  readFileSync(filePath: string, encoding?: string): string {
    return this.tsWorker.readFile(filePath) || ''
  }

  realpathSync(path: string): string {
    return path
  }

  writeFile(filePath: string, fileText: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  writeFileSync(filePath: string, fileText: string): void {}
}
