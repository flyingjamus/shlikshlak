import { ElementType } from 'react'
import { Fiber } from 'react-reconciler'
import { ComponentFilter, Plugins } from '../types'
import { ReactContext, Wakeable } from '../../shared/ReactTypes'
import { ResolveNativeStyle } from './NativeStyleEditor/setupNativeStyleEditor'
import { TimelineDataExport } from 'react-devtools-inline'
import { Source } from '../../shared/ReactElementType'

type BundleType =
  | 0 // PROD
  | 1
// DEV
export type WorkTag = number
export type WorkFlags = number
export type ExpirationTime = number
export type WorkTagMap = {
  CacheComponent: WorkTag
  ClassComponent: WorkTag
  ContextConsumer: WorkTag
  ContextProvider: WorkTag
  CoroutineComponent: WorkTag
  CoroutineHandlerPhase: WorkTag
  DehydratedSuspenseComponent: WorkTag
  ForwardRef: WorkTag
  Fragment: WorkTag
  FunctionComponent: WorkTag
  HostComponent: WorkTag
  HostPortal: WorkTag
  HostRoot: WorkTag
  HostText: WorkTag
  IncompleteClassComponent: WorkTag
  IndeterminateComponent: WorkTag
  LazyComponent: WorkTag
  LegacyHiddenComponent: WorkTag
  MemoComponent: WorkTag
  Mode: WorkTag
  OffscreenComponent: WorkTag
  Profiler: WorkTag
  ScopeComponent: WorkTag
  SimpleMemoComponent: WorkTag
  SuspenseComponent: WorkTag
  SuspenseListComponent: WorkTag
  TracingMarkerComponent: WorkTag
  YieldComponent: WorkTag
}
// TODO: If it's useful for the frontend to know which types of data an Element has
// (e.g. props, state, context, hooks) then we could add a bitmask field for this
// to keep the number of attributes small.
export type FiberData = {
  key: string | null
  displayName: string | null
  type: ElementType
}
export type NativeType = Record<string, any>
export type RendererID = number
type Dispatcher = any
export type CurrentDispatcherRef = {
  current: null | Dispatcher
}
export type GetDisplayNameForFiberID = (id: number, findNearestUnfilteredAncestor?: boolean) => string | null
export type GetFiberIDForNative = (
  component: NativeType,
  findNearestUnfilteredAncestor?: boolean
) => number | null
export type FindNativeNodesForFiberID = (id: number) => Array<NativeType> | null | undefined
export type ReactProviderType<T> = {
  $$typeof: Symbol | number
  _context: ReactContext<T>
}
export type Lane = number
export type Lanes = number
export type ReactRenderer = {
  findFiberByHostInstance: (hostInstance: NativeType) => Fiber | null
  version: string
  rendererPackageName: string
  bundleType: BundleType
  // 16.9+
  overrideHookState?:
    | ((fiber: Record<string, any>, id: number, path: Array<string | number>, value: any) => void)
    | null
    | undefined
  // 17+
  overrideHookStateDeletePath?:
    | ((fiber: Record<string, any>, id: number, path: Array<string | number>) => void)
    | null
    | undefined
  // 17+
  overrideHookStateRenamePath?:
    | ((
        fiber: Record<string, any>,
        id: number,
        oldPath: Array<string | number>,
        newPath: Array<string | number>
      ) => void)
    | null
    | undefined
  // 16.7+
  overrideProps?:
    | ((fiber: Record<string, any>, path: Array<string | number>, value: any) => void)
    | null
    | undefined
  // 17+
  overridePropsDeletePath?:
    | ((fiber: Record<string, any>, path: Array<string | number>) => void)
    | null
    | undefined
  // 17+
  overridePropsRenamePath?:
    | ((fiber: Record<string, any>, oldPath: Array<string | number>, newPath: Array<string | number>) => void)
    | null
    | undefined
  // 16.9+
  scheduleUpdate?: ((fiber: Record<string, any>) => void) | null | undefined
  setSuspenseHandler?: ((shouldSuspend: (fiber: Record<string, any>) => boolean) => void) | null | undefined
  // Only injected by React v16.8+ in order to support hooks inspection.
  currentDispatcherRef?: CurrentDispatcherRef
  // Only injected by React v16.9+ in DEV mode.
  // Enables DevTools to append owners-only component stack to error messages.
  getCurrentFiber?: () => Fiber | null
  // 17.0.2+
  reconcilerVersion?: string
  // Uniquely identifies React DOM v15.
  ComponentTree?: any
  // Present for React DOM v12 (possibly earlier) through v15.
  Mount?: any
  // Only injected by React v17.0.3+ in DEV mode
  setErrorHandler?:
    | ((shouldError: (fiber: Record<string, any>) => boolean | null | undefined) => void)
    | null
    | undefined
  // Intentionally opaque type to avoid coupling DevTools to different Fast Refresh versions.
  scheduleRefresh?: (...args: Array<any>) => any
  // 18.0+
  injectProfilingHooks?: (profilingHooks: DevToolsProfilingHooks) => void
  getLaneLabelMap?: () => Map<Lane, string> | null
}
export type ChangeDescription = {
  context: Array<string> | boolean | null
  didHooksChange: boolean
  isFirstMount: boolean
  props: Array<string> | null
  state: Array<string> | null
  hooks?: Array<number> | null
}
export type CommitDataBackend = {
  // Tuple of fiber ID and change description
  changeDescriptions: Array<[number, ChangeDescription]> | null
  duration: number
  // Only available in certain (newer) React builds,
  effectDuration: number | null
  // Tuple of fiber ID and actual duration
  fiberActualDurations: Array<[number, number]>
  // Tuple of fiber ID and computed "self" duration
  fiberSelfDurations: Array<[number, number]>
  // Only available in certain (newer) React builds,
  passiveEffectDuration: number | null
  priorityLevel: string | null
  timestamp: number
  updaters: Array<SerializedElement> | null
}
export type ProfilingDataForRootBackend = {
  commitData: Array<CommitDataBackend>
  displayName: string
  // Tuple of Fiber ID and base duration
  initialTreeBaseDurations: Array<[number, number]>
  rootID: number
}
// Profiling data collected by the renderer interface.
// This information will be passed to the frontend and combined with info it collects.
export type ProfilingDataBackend = {
  dataForRoots: Array<ProfilingDataForRootBackend>
  rendererID: number
  timelineData: TimelineDataExport | null
}
export type PathFrame = {
  key: string | null
  index: number
  displayName: string | null
}
export type PathMatch = {
  id: number
  isFullMatch: boolean
}
export type SerializedElement = {
  displayName: string | null
  id: number
  key: number | string | null
  type: ElementType
}
export type OwnersList = {
  id: number
  owners: Array<SerializedElement> | null
}
export type InspectedElement = {
  id: number
  displayName: string | null
  // Does the current renderer support editable hooks and function props?
  canEditHooks: boolean
  canEditFunctionProps: boolean
  // Does the current renderer support advanced editing interface?
  canEditHooksAndDeletePaths: boolean
  canEditHooksAndRenamePaths: boolean
  canEditFunctionPropsDeletePaths: boolean
  canEditFunctionPropsRenamePaths: boolean
  // Is this Error, and can its value be overridden now?
  canToggleError: boolean
  isErrored: boolean
  targetErrorBoundaryID: number | null | undefined
  // Is this Suspense, and can its value be overridden now?
  canToggleSuspense: boolean
  // Can view component source location.
  canViewSource: boolean
  // Does the component have legacy context attached to it.
  hasLegacyContext: boolean
  // Inspectable properties.
  context: Record<string, any> | null
  hooks: Record<string, any> | null
  props: Record<string, any> | null
  state: Record<string, any> | null
  key: number | string | null
  errors: Array<[string, number]>
  warnings: Array<[string, number]>
  // List of owners
  owners: Array<SerializedElement> | null
  // Location of component in source code.
  source: Source | null
  type: ElementType
  // Meta information about the root this element belongs to.
  rootType: string | null
  // Meta information about the renderer that created this element.
  rendererPackageName: string | null
  rendererVersion: string | null
  // UI plugins/visualizations for the inspected element.
  plugins: Plugins
}
export const InspectElementErrorType = 'error'
export const InspectElementFullDataType = 'full-data'
export const InspectElementNoChangeType = 'no-change'
export const InspectElementNotFoundType = 'not-found'
export type InspectElementError = {
  id: number
  responseID: number
  type: 'error'
  errorType: 'user' | 'unknown-hook' | 'uncaught'
  message: string
  stack?: string
}
export type InspectElementFullData = {
  id: number
  responseID: number
  type: 'full-data'
  value: InspectedElement
}
export type InspectElementHydratedPath = {
  id: number
  responseID: number
  type: 'hydrated-path'
  path: Array<string | number>
  value: any
}
export type InspectElementNoChange = {
  id: number
  responseID: number
  type: 'no-change'
}
export type InspectElementNotFound = {
  id: number
  responseID: number
  type: 'not-found'
}
export type InspectedElementPayload =
  | InspectElementError
  | InspectElementFullData
  | InspectElementHydratedPath
  | InspectElementNoChange
  | InspectElementNotFound
export type InstanceAndStyle = {
  instance: Record<string, any> | null
  style: Record<string, any> | null
}
type Type = 'props' | 'hooks' | 'state' | 'context'
export type RendererInterface = {
  findNativeNodesForFiber: (fiber: Fiber) => HTMLElement[]
  cleanup: () => void
  clearErrorsAndWarnings: () => void
  clearErrorsForFiberID: (id: number) => void
  clearWarningsForFiberID: (id: number) => void
  copyElementPath: (id: number, path: Array<string | number>) => void
  deletePath: (
    type: Type,
    id: number,
    hookID: number | null | undefined,
    path: Array<string | number>
  ) => void
  findNativeNodesForFiberID: FindNativeNodesForFiberID
  flushInitialOperations: () => void
  getBestMatchForTrackedPath: () => PathMatch | null
  getFiberId: (fiber: Fiber) => number
  getFiberForNative: (component: NativeType) => Fiber | null
  getFiberIDForNative: GetFiberIDForNative
  getDisplayNameForFiberID: GetDisplayNameForFiberID
  getInstanceAndStyle(id: number): InstanceAndStyle
  getProfilingData(): ProfilingDataBackend
  getOwnersList: (id: number) => Array<SerializedElement> | null
  getPathForElement: (id: number) => Array<PathFrame> | null
  handleCommitFiberRoot: (fiber: Record<string, any>, commitPriority?: number) => void
  handleCommitFiberUnmount: (fiber: Record<string, any>) => void
  handlePostCommitFiberRoot: (fiber: Record<string, any>) => void
  inspectElement: (
    requestID: number,
    id: number,
    inspectedPaths: Record<string, any>,
    forceFullData: boolean
  ) => InspectedElementPayload
  logElementToConsole: (id: number) => void
  overrideError: (id: number, forceError: boolean) => void
  overrideSuspense: (id: number, forceFallback: boolean) => void
  overrideValueAtPath: (
    type: Type,
    id: number,
    hook: number | null | undefined,
    path: Array<string | number>,
    value: any
  ) => void
  patchConsoleForStrictMode: () => void
  prepareViewAttributeSource: (id: number, path: Array<string | number>) => void
  prepareViewElementSource: (id: number) => void
  renamePath: (
    type: Type,
    id: number,
    hookID: number | null | undefined,
    oldPath: Array<string | number>,
    newPath: Array<string | number>
  ) => void
  renderer: ReactRenderer | null
  setTraceUpdatesEnabled: (enabled: boolean) => void
  setTrackedPath: (path: Array<PathFrame> | null) => void
  startProfiling: (recordChangeDescriptions: boolean) => void
  stopProfiling: () => void
  storeAsGlobal: (id: number, path: Array<string | number>, count: number) => void
  unpatchConsoleForStrictMode: () => void
  updateComponentFilters: (componentFilters: Array<ComponentFilter>) => void // Timeline profiler interface
}
export type Handler = (data: any) => void
// Renderers use these APIs to report profiling data to DevTools at runtime.
// They get passed from the DevTools backend to the reconciler during injection.
export type DevToolsProfilingHooks = {
  // Scheduling methods:
  markRenderScheduled: (lane: Lane) => void
  markStateUpdateScheduled: (fiber: Fiber, lane: Lane) => void
  markForceUpdateScheduled: (fiber: Fiber, lane: Lane) => void
  // Work loop level methods:
  markRenderStarted: (lanes: Lanes) => void
  markRenderYielded: () => void
  markRenderStopped: () => void
  markCommitStarted: (lanes: Lanes) => void
  markCommitStopped: () => void
  markLayoutEffectsStarted: (lanes: Lanes) => void
  markLayoutEffectsStopped: () => void
  markPassiveEffectsStarted: (lanes: Lanes) => void
  markPassiveEffectsStopped: () => void
  // Fiber level methods:
  markComponentRenderStarted: (fiber: Fiber) => void
  markComponentRenderStopped: () => void
  markComponentErrored: (fiber: Fiber, thrownValue: unknown, lanes: Lanes) => void
  markComponentSuspended: (fiber: Fiber, wakeable: Wakeable, lanes: Lanes) => void
  markComponentLayoutEffectMountStarted: (fiber: Fiber) => void
  markComponentLayoutEffectMountStopped: () => void
  markComponentLayoutEffectUnmountStarted: (fiber: Fiber) => void
  markComponentLayoutEffectUnmountStopped: () => void
  markComponentPassiveEffectMountStarted: (fiber: Fiber) => void
  markComponentPassiveEffectMountStopped: () => void
  markComponentPassiveEffectUnmountStarted: (fiber: Fiber) => void
  markComponentPassiveEffectUnmountStopped: () => void
}
export type DevToolsHook = {
  listeners: Record<string, Array<Handler>>
  rendererInterfaces: Map<RendererID, RendererInterface>
  renderers: Map<RendererID, ReactRenderer>
  emit: (event: string, data: any) => void
  getFiberRoots: (rendererID: RendererID) => Set<Record<string, any>>
  inject: (renderer: ReactRenderer) => number | null
  on: (event: string, handler: Handler) => void
  off: (event: string, handler: Handler) => void
  reactDevtoolsAgent?: Record<string, any> | null | undefined
  sub: (event: string, handler: Handler) => () => void
  // Used by react-native-web and Flipper/Inspector
  resolveRNStyle?: ResolveNativeStyle
  nativeStyleEditorValidAttributes?: ReadonlyArray<string>
  // React uses these methods.
  checkDCE: (fn: (...args: Array<any>) => any) => void
  onCommitFiberUnmount: (rendererID: RendererID, fiber: Record<string, any>) => void
  onCommitFiberRoot: (
    rendererID: RendererID,
    fiber: Record<string, any>, // Added in v16.9 to support Profiler priority labels
    commitPriority?: number, // Added in v16.9 to support Fast Refresh
    didError?: boolean
  ) => void
  // Timeline internal module filtering
  getInternalModuleRanges: () => Array<[string, string]>
  registerInternalModuleStart: (moduleStartError: Error) => void
  registerInternalModuleStop: (moduleStopError: Error) => void
  // Testing
  dangerous_setTargetConsoleForTesting?: (fakeConsole: Record<string, any>) => void

  $0?: Node
}
