import type { ReactContext } from "shared/ReactTypes";
import { enableCache } from "shared/ReactFeatureFlags";
import { REACT_CONTEXT_TYPE } from "shared/ReactSymbols";
import { pushProvider, popProvider } from "./ReactFiberNewContext.old";
import * as Scheduler from "scheduler";
// In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.
const AbortControllerLocal = enableCache ? typeof AbortController !== 'undefined' ? AbortController : (function AbortControllerShim() {
  const listeners = [];
  const signal = this.signal = {
    aborted: false,
    addEventListener: (type, listener) => {
      listeners.push(listener);
    }
  };

  this.abort = () => {
    signal.aborted = true;
    listeners.forEach(listener => listener());
  };
} as AbortController) : (null as any);
export type Cache = {
  controller: AbortControllerLocal;
  data: Map<() => unknown, unknown>;
  refCount: number;
};
export type CacheComponentState = {
  readonly parent: Cache;
  readonly cache: Cache;
};
export type SpawnedCachePool = {
  readonly parent: Cache;
  readonly pool: Cache;
};
// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
const {
  unstable_scheduleCallback: scheduleCallback,
  unstable_NormalPriority: NormalPriority
} = Scheduler;
export const CacheContext: ReactContext<Cache> = enableCache ? {
  $$typeof: REACT_CONTEXT_TYPE,
  // We don't use Consumer/Provider for Cache components. So we'll cheat.
  Consumer: (null as any),
  Provider: (null as any),
  // We'll initialize these at the root.
  _currentValue: (null as any),
  _currentValue2: (null as any),
  _threadCount: 0,
  _defaultValue: (null as any),
  _globalName: (null as any)
} : (null as any);

if (__DEV__ && enableCache) {
  CacheContext._currentRenderer = null;
  CacheContext._currentRenderer2 = null;
}

// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).
export function createCache(): Cache {
  if (!enableCache) {
    return (null as any);
  }

  const cache: Cache = {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0
  };
  return cache;
}
export function retainCache(cache: Cache) {
  if (!enableCache) {
    return;
  }

  if (__DEV__) {
    if (cache.controller.signal.aborted) {
      console.warn('A cache instance was retained after it was already freed. ' + 'This likely indicates a bug in React.');
    }
  }

  cache.refCount++;
}
// Cleanup a cache instance, potentially freeing it if there are no more references
export function releaseCache(cache: Cache) {
  if (!enableCache) {
    return;
  }

  cache.refCount--;

  if (__DEV__) {
    if (cache.refCount < 0) {
      console.warn('A cache instance was released after it was already freed. ' + 'This likely indicates a bug in React.');
    }
  }

  if (cache.refCount === 0) {
    scheduleCallback(NormalPriority, () => {
      cache.controller.abort();
    });
  }
}
export function pushCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }

  pushProvider(workInProgress, CacheContext, cache);
}
export function popCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }

  popProvider(CacheContext, workInProgress);
}