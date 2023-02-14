import type { Fiber } from "./ReactInternalTypes";
import { getStackByFiberInDevAndProd } from "./ReactFiberComponentStack";
export type CapturedValue<T> = {
  value: T;
  source: Fiber | null;
  stack: string | null;
  digest: string | null;
};
export function createCapturedValueAtFiber<T>(value: T, source: Fiber): CapturedValue<T> {
  // If the value is an error, call this function immediately after it is thrown
  // so the stack is accurate.
  return {
    value,
    source,
    stack: getStackByFiberInDevAndProd(source),
    digest: null
  };
}
export function createCapturedValue<T>(value: T, digest: string | null | undefined, stack: string | null | undefined): CapturedValue<T> {
  return {
    value,
    source: null,
    stack: stack != null ? stack : null,
    digest: digest != null ? digest : null
  };
}