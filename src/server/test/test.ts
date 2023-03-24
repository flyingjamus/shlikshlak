import path from 'path'
import { startIoSession } from '../session'
import { asNormalizedPath } from '../ts/utilitiesPublic'
import { getTsMethods } from '../ts'

const ioSession = startIoSession()
console.log('Started IO session')

// const FILE = 'src/stories/example.stories.tsx'
// const FILE = '/home/danny/dev/nimbleway/pages/login.tsx'
// const FILE = '/home/danny/dev/nimbleway/src/components/Layout/SideNav/SideNav.tsx'
const FILE = 'src/server/test/fixtures/enum.fixture.tsx'

ioSession.projectService.openClientFile(path.resolve(FILE))
const project = ioSession.projectService.getDefaultProjectForFile(asNormalizedPath(FILE), true)!

if (!project) throw new Error('Project missing')

const { getPanelsAtPosition, getPanelsAtLocation } = getTsMethods(ioSession, project)

;(async () => {
  const res = await getPanelsAtLocation(path.resolve(FILE), 6, 11)
  console.dir(res, { depth: Infinity })
})()
