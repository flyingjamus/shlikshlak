import { useContext, useMemo } from 'react'
import { SettingsContext } from './Settings/SettingsContext'
import { THEME_STYLES } from '../../constants'

const useThemeStyles = () => {
  const { theme, displayDensity, browserTheme } = useContext(SettingsContext)

  const style = useMemo(
    () => ({
      ...THEME_STYLES[displayDensity],
      ...THEME_STYLES[theme === 'auto' ? browserTheme : theme],
    }),
    [theme, browserTheme, displayDensity]
  )

  return style
}

export default useThemeStyles
