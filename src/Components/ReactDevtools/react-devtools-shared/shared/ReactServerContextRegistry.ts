import { REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED } from "shared/ReactSymbols";
import ReactSharedInternals from "shared/ReactSharedInternals";
import { createServerContext } from "react";
const ContextRegistry = ReactSharedInternals.ContextRegistry;
export function getOrCreateServerContext(globalName: string) {
  if (!ContextRegistry[globalName]) {
    ContextRegistry[globalName] = createServerContext(globalName, REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED);
  }

  return ContextRegistry[globalName];
}