declare function isArray(a: unknown): boolean;
const isArrayImpl = Array.isArray;

// eslint-disable-next-line no-redeclare
function isArray(a: unknown): boolean {
  return isArrayImpl(a);
}

export default isArray;