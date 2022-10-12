// Renderers that don't support microtasks
// can re-export everything from this module.
function shim(...args: any) {
  throw new Error('The current renderer does not support microtasks. ' + 'This error is likely caused by a bug in React. ' + 'Please file an issue.');
}

// Test selectors (when unsupported)
export const supportsMicrotasks = false;
export const scheduleMicrotask = shim;