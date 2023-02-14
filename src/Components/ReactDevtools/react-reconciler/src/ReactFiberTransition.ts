import ReactSharedInternals from "shared/ReactSharedInternals";
import type { Transition } from "./ReactFiberTracingMarkerComponent.new";
const {
  ReactCurrentBatchConfig
} = ReactSharedInternals;
export const NoTransition = null;
export function requestCurrentTransition(): Transition | null {
  return ReactCurrentBatchConfig.transition;
}