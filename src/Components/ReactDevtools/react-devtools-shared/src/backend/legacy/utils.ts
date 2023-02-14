import type { InternalInstance } from "./renderer";
export function decorate(object: Record<string, any>, attr: string, fn: (...args: Array<any>) => any): (...args: Array<any>) => any {
  const old = object[attr];

  object[attr] = function (instance: InternalInstance) {
    return fn.call(this, old, arguments);
  };

  return old;
}
export function decorateMany(source: Record<string, any>, fns: Record<string, (...args: Array<any>) => any>): Record<string, any> {
  const olds = {};

  for (const name in fns) {
    olds[name] = decorate(source, name, fns[name]);
  }

  return olds;
}
export function restoreMany(source: Record<string, any>, olds: Record<string, any>): void {
  for (const name in olds) {
    source[name] = olds[name];
  }
}
export function forceUpdate(instance: InternalInstance): void {
  if (typeof instance.forceUpdate === 'function') {
    instance.forceUpdate();
  } else if (instance.updater != null && typeof instance.updater.enqueueForceUpdate === 'function') {
    instance.updater.enqueueForceUpdate(this, () => {}, 'forceUpdate');
  }
}