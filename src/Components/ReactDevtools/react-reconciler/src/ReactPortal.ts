import { REACT_PORTAL_TYPE } from "shared/ReactSymbols";
import { checkKeyStringCoercion } from "shared/CheckStringCoercion";
import type { ReactNodeList, ReactPortal } from "shared/ReactTypes";
export function createPortal(children: ReactNodeList, containerInfo: any, // TODO: figure out the API for cross-renderer implementation.
implementation: any, key: string | null | undefined = null): ReactPortal {
  if (__DEV__) {
    checkKeyStringCoercion(key);
  }

  return {
    // This tag allow us to uniquely identify this as a React Portal
    $$typeof: REACT_PORTAL_TYPE,
    key: key == null ? null : '' + key,
    children,
    containerInfo,
    implementation
  };
}