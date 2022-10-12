import type { Thenable } from 'shared/ReactTypes'
import { createContext } from 'react'
import * as ParseHookNamesModule from 'react-devtools-shared/src/hooks/parseHookNames'
export type HookNamesModuleLoaderFunction = () => Thenable<ParseHookNamesModule>
export type Context = HookNamesModuleLoaderFunction | null
// TODO (Webpack 5) Hopefully we can remove this context entirely once the Webpack 5 upgrade is completed.
const HookNamesModuleLoaderContext = createContext<Context>(null)
HookNamesModuleLoaderContext.displayName = 'HookNamesModuleLoaderContext'
export default HookNamesModuleLoaderContext
