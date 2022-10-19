import { PropsEditor } from '../Components/PropsEditor/PropsEditor'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import { useFileStore } from '../Components/store'

export default {
  title: 'Props Editor',
  component: PropsEditor,
  decorators: [],
  args: {},
} as ComponentMeta<typeof PropsEditor>

const Template: ComponentStory<typeof PropsEditor> = PropsEditor

export const Story = Template.bind({})
Story.args = {
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
      { name: 'size', value: 'small' },
      { name: 'onClick', value: 'onLogout' },
      { name: 'label', value: 'Log out' },
    ],
  },
}
