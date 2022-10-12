import type { Lane, Lanes } from "./ReactFiberLane.old";
import type { Wakeable } from "shared/ReactTypes";
import { enableDebugTracing } from "shared/ReactFeatureFlags";
const nativeConsole: Record<string, any> = console;
let nativeConsoleLog: null | ((...args: Array<any>) => any) = null;
const pendingGroupArgs: Array<any> = [];
let printedGroupIndex: number = -1;

function formatLanes(laneOrLanes: Lane | Lanes): string {
  return '0b' + (laneOrLanes as any).toString(2).padStart(31, '0');
}

function group(...groupArgs): void {
  pendingGroupArgs.push(groupArgs);

  if (nativeConsoleLog === null) {
    nativeConsoleLog = nativeConsole.log;
    nativeConsole.log = log;
  }
}

function groupEnd(): void {
  pendingGroupArgs.pop();

  while (printedGroupIndex >= pendingGroupArgs.length) {
    nativeConsole.groupEnd();
    printedGroupIndex--;
  }

  if (pendingGroupArgs.length === 0) {
    nativeConsole.log = nativeConsoleLog;
    nativeConsoleLog = null;
  }
}

function log(...logArgs): void {
  if (printedGroupIndex < pendingGroupArgs.length - 1) {
    for (let i = printedGroupIndex + 1; i < pendingGroupArgs.length; i++) {
      const groupArgs = pendingGroupArgs[i];
      nativeConsole.group(...groupArgs);
    }

    printedGroupIndex = pendingGroupArgs.length - 1;
  }

  if (typeof nativeConsoleLog === 'function') {
    nativeConsoleLog(...logArgs);
  } else {
    nativeConsole.log(...logArgs);
  }
}

const REACT_LOGO_STYLE = 'background-color: #20232a; color: #61dafb; padding: 0 2px;';
export function logCommitStarted(lanes: Lanes): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      group(`%c⚛️%c commit%c (${formatLanes(lanes)})`, REACT_LOGO_STYLE, '', 'font-weight: normal;');
    }
  }
}
export function logCommitStopped(): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      groupEnd();
    }
  }
}
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
// @ts-expect-error: Flow cannot handle polymorphic WeakMaps
const wakeableIDs: WeakMap<Wakeable, number> = new PossiblyWeakMap();
let wakeableID: number = 0;

function getWakeableID(wakeable: Wakeable): number {
  if (!wakeableIDs.has(wakeable)) {
    wakeableIDs.set(wakeable, wakeableID++);
  }

  return ((wakeableIDs.get(wakeable) as any) as number);
}

export function logComponentSuspended(componentName: string, wakeable: Wakeable): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      const id = getWakeableID(wakeable);
      const display = (wakeable as any).displayName || wakeable;
      log(`%c⚛️%c ${componentName} suspended`, REACT_LOGO_STYLE, 'color: #80366d; font-weight: bold;', id, display);
      wakeable.then(() => {
        log(`%c⚛️%c ${componentName} resolved`, REACT_LOGO_STYLE, 'color: #80366d; font-weight: bold;', id, display);
      }, () => {
        log(`%c⚛️%c ${componentName} rejected`, REACT_LOGO_STYLE, 'color: #80366d; font-weight: bold;', id, display);
      });
    }
  }
}
export function logLayoutEffectsStarted(lanes: Lanes): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      group(`%c⚛️%c layout effects%c (${formatLanes(lanes)})`, REACT_LOGO_STYLE, '', 'font-weight: normal;');
    }
  }
}
export function logLayoutEffectsStopped(): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      groupEnd();
    }
  }
}
export function logPassiveEffectsStarted(lanes: Lanes): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      group(`%c⚛️%c passive effects%c (${formatLanes(lanes)})`, REACT_LOGO_STYLE, '', 'font-weight: normal;');
    }
  }
}
export function logPassiveEffectsStopped(): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      groupEnd();
    }
  }
}
export function logRenderStarted(lanes: Lanes): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      group(`%c⚛️%c render%c (${formatLanes(lanes)})`, REACT_LOGO_STYLE, '', 'font-weight: normal;');
    }
  }
}
export function logRenderStopped(): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      groupEnd();
    }
  }
}
export function logForceUpdateScheduled(componentName: string, lane: Lane): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      log(`%c⚛️%c ${componentName} forced update %c(${formatLanes(lane)})`, REACT_LOGO_STYLE, 'color: #db2e1f; font-weight: bold;', '');
    }
  }
}
export function logStateUpdateScheduled(componentName: string, lane: Lane, payloadOrAction: any): void {
  if (__DEV__) {
    if (enableDebugTracing) {
      log(`%c⚛️%c ${componentName} updated state %c(${formatLanes(lane)})`, REACT_LOGO_STYLE, 'color: #01a252; font-weight: bold;', '', payloadOrAction);
    }
  }
}