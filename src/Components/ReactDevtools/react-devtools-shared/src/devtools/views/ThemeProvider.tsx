import * as React from 'react'
import useThemeStyles from './useThemeStyles'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeStyle = useThemeStyles()
  const style = React.useMemo(() => {
    return {
      ...themeStyle,
      width: '100%',
      height: '100%',
    }
  }, [themeStyle])
  return <div style={style}>{children}</div>
}
