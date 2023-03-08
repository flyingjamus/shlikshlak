/* eslint-disable @typescript-eslint/no-empty-interface */
import { createTheme } from '@mui/material/styles'
import { CSSProperties } from 'react'

declare module '@mui/material/styles/createMixins' {
  export interface Mixins {}
  export interface MixinsOptions extends Mixins {}
}

declare module '@mui/material/styles' {
  interface TextStyles {
    mono: CSSProperties
  }
  interface TypographyVariants extends TextStyles {}
  interface TypographyVariantsOptions extends TextStyles {}
}

declare module '@mui/material/Typography' {
  interface TextStylesOverrides {
    mono: true
  }
  interface TypographyPropsVariantOverrides extends TextStylesOverrides {}
}
const baseTheme = createTheme({})

const theme = createTheme({
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica,\n    Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol',
    mono: {
      fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,\n    Courier, monospace",
    },
  },
})

export default theme
