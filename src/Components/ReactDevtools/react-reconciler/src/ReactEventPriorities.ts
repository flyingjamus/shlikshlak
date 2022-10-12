import { enableNewReconciler } from "shared/ReactFeatureFlags";
import { DiscreteEventPriority as DiscreteEventPriority_old, ContinuousEventPriority as ContinuousEventPriority_old, DefaultEventPriority as DefaultEventPriority_old, IdleEventPriority as IdleEventPriority_old, getCurrentUpdatePriority as getCurrentUpdatePriority_old, setCurrentUpdatePriority as setCurrentUpdatePriority_old, runWithPriority as runWithPriority_old, isHigherEventPriority as isHigherEventPriority_old } from "./ReactEventPriorities.old";
import { DiscreteEventPriority as DiscreteEventPriority_new, ContinuousEventPriority as ContinuousEventPriority_new, DefaultEventPriority as DefaultEventPriority_new, IdleEventPriority as IdleEventPriority_new, getCurrentUpdatePriority as getCurrentUpdatePriority_new, setCurrentUpdatePriority as setCurrentUpdatePriority_new, runWithPriority as runWithPriority_new, isHigherEventPriority as isHigherEventPriority_new } from "./ReactEventPriorities.new";
export opaque type EventPriority = number;
export const DiscreteEventPriority: EventPriority = enableNewReconciler ? (DiscreteEventPriority_new as any) : (DiscreteEventPriority_old as any);
export const ContinuousEventPriority: EventPriority = enableNewReconciler ? (ContinuousEventPriority_new as any) : (ContinuousEventPriority_old as any);
export const DefaultEventPriority: EventPriority = enableNewReconciler ? (DefaultEventPriority_new as any) : (DefaultEventPriority_old as any);
export const IdleEventPriority: EventPriority = enableNewReconciler ? (IdleEventPriority_new as any) : (IdleEventPriority_old as any);
export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  return enableNewReconciler ? runWithPriority_new((priority as any), fn) : runWithPriority_old((priority as any), fn);
}
export function getCurrentUpdatePriority(): EventPriority {
  return enableNewReconciler ? (getCurrentUpdatePriority_new() as any) : (getCurrentUpdatePriority_old() as any);
}
export function setCurrentUpdatePriority(priority: EventPriority) {
  return enableNewReconciler ? setCurrentUpdatePriority_new((priority as any)) : setCurrentUpdatePriority_old((priority as any));
}
export function isHigherEventPriority(a: EventPriority, b: EventPriority): boolean {
  return enableNewReconciler ? isHigherEventPriority_new((a as any), (b as any)) : isHigherEventPriority_old((a as any), (b as any));
}