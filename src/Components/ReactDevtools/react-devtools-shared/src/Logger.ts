// import { enableLogger } from "react-devtools-feature-flags";
const enableLogger = true
export type LoggerEvent = {
  readonly event_name: "loaded-dev-tools";
} | {
  readonly event_name: "error";
  readonly error_message: string | null;
  readonly error_stack: string | null;
  readonly error_component_stack: string | null;
} | {
  readonly event_name: "selected-components-tab";
} | {
  readonly event_name: "selected-profiler-tab";
} | {
  readonly event_name: "load-hook-names";
  readonly event_status: "success" | "error" | "timeout" | "unknown";
  readonly duration_ms: number;
  readonly inspected_element_display_name: string | null;
  readonly inspected_element_number_of_hooks: number | null;
} | {
  readonly event_name: "select-element";
  readonly metadata: {
    readonly source: string;
  };
} | {
  readonly event_name: "inspect-element-button-clicked";
} | {
  readonly event_name: "profiling-start";
  readonly metadata: {
    readonly current_tab: string;
  };
} | {
  readonly event_name: "profiler-tab-changed";
  readonly metadata: {
    readonly tabId: string;
  };
} | {
  readonly event_name: "settings-changed";
  readonly metadata: {
    readonly key: string;
    readonly value: any;
  };
};
export type LogFunction = (arg0: LoggerEvent) => void | Promise<void>;
let logFunctions: Array<LogFunction> = [];
export const logEvent: LogFunction = enableLogger === true ? function logEvent(event: LoggerEvent): void {
  logFunctions.forEach(log => {
    log(event);
  });
} : function logEvent() {};
export const registerEventLogger = enableLogger === true ? function registerEventLogger(logFunction: LogFunction): () => void {
  if (enableLogger) {
    logFunctions.push(logFunction);
    return function unregisterEventLogger() {
      logFunctions = logFunctions.filter(log => log !== logFunction);
    };
  }

  return () => {};
} : function registerEventLogger(logFunction: LogFunction) {
  return () => {};
};
