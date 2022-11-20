import * as DOM from '../domains/DOM'
import { getNodeReactLocation } from '../domains/DOM'
import { activate } from '../../../ReactDevtools/react-devtools-inline/backend'
import * as CSS from '../domains/CSS'
import * as Page from '../domains/Page'
import * as Network from '../domains/Network'
import * as Overlay from '../domains/Overlay'
import * as Runtime from '../domains/Runtime'
import * as Storage from '../domains/Storage'
import * as Debugger from '../domains/Debugger'
import * as DOMStorage from '../domains/DOMStorage'
import * as DOMDebugger from '../domains/DOMDebugger'

import { noop } from './util'

const methods = {
  // Debugger: {
  //   enable: Debugger.enable,
  //   setAsyncCallStackDepth: noop,
  //   setBlackboxPatterns: noop,
  //   setPauseOnExceptions: noop,
  // },
  // DOM: {
  //   collectClassNamesFromSubtree: DOM.collectClassNamesFromSubtree,
  //   copyTo: DOM.copyTo,
  //   discardSearchResults: DOM.discardSearchResults,
  //   enable: DOM.enable,
  //   getDocument: DOM.getDocument,
  //   getOuterHTML: DOM.getOuterHTML,
  //   getSearchResults: DOM.getSearchResults,
  //   markUndoableState: noop,
  //   moveTo: DOM.moveTo,
  //   performSearch: DOM.performSearch,
  //   pushNodesByBackendIdsToFrontend: DOM.pushNodesByBackendIdsToFrontend,
  //   removeNode: DOM.removeNode,
  //   requestChildNodes: DOM.requestChildNodes,
  //   requestNode: DOM.requestNode,
  //   resolveNode: DOM.resolveNode,
  //   setAttributesAsText: DOM.setAttributesAsText,
  //   setAttributeValue: DOM.setAttributeValue,
  //   setInspectedNode: DOM.setInspectedNode,
  //   setNodeValue: DOM.setNodeValue,
  //   setOuterHTML: DOM.setOuterHTML,
  //   undo: noop,
  // },
  //
  // DOMDebugger: {
  //   'DOMDebugger.getEventListeners': DOMDebugger.getEventListeners,
  // },
  //
  // 'Emulation.setEmulatedMedia': noop,
  //
  // 'Log.clear': noop,
  // 'Log.enable': noop,
  // 'Log.startViolationsReport': noop,
  //
  // 'Network.deleteCookies': Network.deleteCookies,
  // 'Network.enable': Network.enable,
  // 'Network.getCookies': Network.getCookies,
  // 'Network.getResponseBody': Network.getResponseBody,
  //
  // 'Page.getResourceContent': noop,
  // 'Page.getResourceTree': Page.getResourceTree,
  //
  // 'Runtime.callFunctionOn': Runtime.callFunctionOn,
  // 'Runtime.compileScript': noop,
  // 'Runtime.discardConsoleEntries': noop,
  // 'Runtime.enable': Runtime.enable,
  // 'Runtime.evaluate': Runtime.evaluate,
  // 'Runtime.getHeapUsage': noop,
  // 'Runtime.getIsolateId': noop,
  // 'Runtime.getProperties': Runtime.getProperties,
  // 'Runtime.releaseObject': noop,
  // 'Runtime.releaseObjectGroup': noop,
  // 'Runtime.runIfWaitingForDebugger': noop,
  //
  // 'ApplicationCache.enable': noop,
  // 'ApplicationCache.getFramesWithManifests': noop,
  //
  // 'Page.getManifestIcons': noop,
  // 'Page.bringToFront': noop,
  // 'Page.enable': noop,
  // 'Page.getAppManifest': Page.getAppManifest,
  // 'Page.getInstallabilityErrors': noop,
  //
  // 'Profiler.enable': noop,
  //
  // 'Audits.enable': noop,
  //
  // 'BackgroundService.startObserving': noop,
  //
  // 'CacheStorage.requestCacheNames': noop,
  //
  // 'CSS.enable': CSS.enable,
  // 'CSS.getComputedStyleForNode': CSS.getComputedStyleForNode,
  // 'CSS.getInlineStylesForNode': CSS.getInlineStylesForNode,
  // 'CSS.getMatchedStylesForNode': CSS.getMatchedStylesForNode,
  // 'CSS.getPlatformFontsForNode': noop,
  // 'CSS.getStyleSheetText': CSS.getStyleSheetText,
  // 'CSS.getBackgroundColors': CSS.getBackgroundColors,
  // 'CSS.setStyleTexts': CSS.setStyleTexts,
  //
  // 'Database.enable': noop,
  //
  // 'DOMStorage.clear': DOMStorage.clear,
  // 'DOMStorage.enable': DOMStorage.enable,
  // 'DOMStorage.getDOMStorageItems': DOMStorage.getDOMStorageItems,
  // 'DOMStorage.removeDOMStorageItem': DOMStorage.removeDOMStorageItem,
  // 'DOMStorage.setDOMStorageItem': DOMStorage.setDOMStorageItem,
  //
  // 'HeapProfiler.enable': noop,
  //
  // 'IndexedDB.enable': noop,
  //
  // 'Inspector.enable': noop,
  // 'IndexedDB.requestDatabaseNames': noop,
  //
  Overlay: {
    enable: noop,
    hideHighlight: Overlay.hideHighlight,
    highlightFrame: noop,
    highlightNode: Overlay.highlightNode,
    setInspectMode: Overlay.setInspectMode,
    setShowViewportSizeOnResize: Overlay.setShowViewportSizeOnResize,
  },
  //
  // 'ServiceWorker.enable': noop,
  //
  // 'Storage.getUsageAndQuota': Storage.getUsageAndQuota,
  //
  // 'Storage.trackCacheStorageForOrigin': noop,
  // 'Storage.trackIndexedDBForOrigin': noop,
  // 'Storage.clearDataForOrigin': Storage.clearDataForOrigin,
  //
  getNodeReactLocation: getNodeReactLocation,
  init() {
    console.log('Activating devtools')
    activate(window)
    Overlay.init()
  },
} as const

export type Methods = typeof methods
export type MethodKey = keyof typeof methods

export default methods
