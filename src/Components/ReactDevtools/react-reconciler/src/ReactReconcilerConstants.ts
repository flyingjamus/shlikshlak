// These are semi-public constants exposed to any third-party renderers.
// Only expose the minimal subset necessary to implement a host config.
export { DiscreteEventPriority, ContinuousEventPriority, DefaultEventPriority, IdleEventPriority } from "./ReactEventPriorities";
export { ConcurrentRoot, LegacyRoot } from "./ReactRootTags";