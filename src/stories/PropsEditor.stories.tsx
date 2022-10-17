import { PropsEditor } from '../Components/PropsEditor/PropsEditor'
import { ComponentMeta } from '@storybook/react'
import { useFileStore } from '../Components/store'

export default {
  title: 'PropsEditor',
  component: PropsEditor,
  decorators: [
    (Story) => {
      useFileStore.setState(
        {
          panels: {
            attributes: [
              { name: 'key', panels: [{ name: 'string' }] },
              { name: 'primary', panels: [{ name: 'boolean' }] },
              { name: 'backgroundColor', panels: [{ name: 'string' }] },
              {
                name: 'size',
                panels: [{ name: 'enum', parameters: { values: ['small', 'medium', 'large'] } }],
              },
              { name: 'label', panels: [{ name: 'string' }] },
              { name: 'onClick', panels: [] },
            ],
            existingAttributes: [
              { name: 'size', value: '"small"' },
              { name: 'onClick', value: '{onLogout}' },
              { name: 'label', value: '"Log out"' },
            ],
          },
        },
        true
      )
      return <Story />
    },
  ],
} as ComponentMeta<typeof PropsEditor>

export const Story = PropsEditor
