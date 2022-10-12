import React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import MonacoEditor from './MonacoEditor'
import { Box } from '@mui/material'
import { useFileStore } from '../store'

export default {
  title: 'Editor',
  component: MonacoEditor,
  decorators: [
    (Story) => {
      useFileStore.setState(
        { files: { '1.tsx': { path: '/1.tsx', code: "import React from 'react'" } } },
        true
      )
      return <Story />
    },
  ],
} as ComponentMeta<typeof MonacoEditor>

const Template: ComponentStory<typeof MonacoEditor> = (args) => (
  <Box height={'500px'}>
    <MonacoEditor {...args} />
  </Box>
)

export const Regular = Template
