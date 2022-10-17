const { mergeConfig } = require('vite')
const monacoEditorPlugin = require('vite-plugin-monaco-editor')

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-vite',
  },
  features: {
    storyStoreV7: true,
  },
  async viteFinal(config, { configType }) {
    return mergeConfig(config, {
      // plugins: [monacoEditorPlugin.default()],
      plugins: [],
      optimizeDeps: {
        include: [
          '@storybook/addon-a11y/preview.js',
          '@storybook/addon-actions/preview.js',
          '@storybook/addon-backgrounds/preview.js',
          'babel-plugin-open-source/script.js',
          'chromatic/isChromatic',
          'storybook-dark-mode',
        ],
      },
    })
  },
}
