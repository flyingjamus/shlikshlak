// Renderers that don't support React Scopes
// can re-export everything from this module.
function shim(...args: any) {
  throw new Error('The current renderer does not support React Scopes. ' + 'This error is likely caused by a bug in React. ' + 'Please file an issue.');
}

// React Scopes (when unsupported)
export const prepareScopeUpdate = shim;
export const getInstanceFromScope = shim;