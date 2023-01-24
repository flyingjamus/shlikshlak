import * as ts from 'typescript'
import { COMPILER_OPTIONS } from '../Components/Editor/COMPILER_OPTIONS'

const filename = 'src/stories/example.stories.tsx'
function watchMain() {
  const configPath = ts.findConfigFile(/*searchPath*/ './', ts.sys.fileExists, 'tsconfig.json')
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.")
  }

  const program = ts.createProgram([filename], COMPILER_OPTIONS)
}

watchMain()
