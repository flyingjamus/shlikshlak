import { DecoratorFunction } from '@storybook/addons'
import { ReactElement } from 'react'
import { PreviewOverlay } from '../src/StorybookFrame/PreviewOverlay'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators: DecoratorFunction<ReactElement>[] = [
  (Story) => (
    <>
      <Story />
      {/*<PreviewOverlay />*/}
    </>
  ),
]
