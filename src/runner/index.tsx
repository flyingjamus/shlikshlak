import { render, Box, Text } from 'ink'
import * as React from 'react'

import FullScreen from './FullScreen'
import Terminal from './Terminal'

function SnackTerminal() {
  return (
    <FullScreen>
      {(size) => (
        <Box flexDirection="row">
          <Terminal
            cwd="."
            command="yarn"
            args={['dev']}
            width={Math.round(size.width / 3)}
            height={size.height}
          />
          <Terminal
            cwd="."
            command="yarn"
            args={['dev:server']}
            width={Math.round(size.width / 3)}
            height={size.height}
          />
          <Terminal
            cwd="."
            command="yarn"
            args={['dev:devtools']}
            width={Math.round(size.width / 3)}
            height={size.height}
          />
        </Box>
      )}
    </FullScreen>
  )
}

const { waitUntilExit } = render(<SnackTerminal />)

waitUntilExit().then(() => {
  console.log('Shutdown signal received, press Ctrl+C to exit')
})
