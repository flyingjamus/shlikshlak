const cachedDisplayNames: WeakMap<(...args: Array<any>) => any, string> = new WeakMap()

// Mirror https://github.com/facebook/react/blob/7c21bf72ace77094fd1910cc350a548287ef8350/packages/shared/getComponentName.js#L27-L37
export function getWrappedDisplayName(
  outerType: unknown,
  innerType: any,
  wrapperName: string,
  fallbackName?: string
): string {
  const displayName = (outerType as any).displayName
  return displayName || `${wrapperName}(${getDisplayName(innerType, fallbackName)})`
}

export function getDisplayName(
  type: (...args: Array<any>) => any,
  fallbackName = 'Anonymous'
): string {
  const nameFromCache = cachedDisplayNames.get(type)

  if (nameFromCache != null) {
    return nameFromCache
  }

  let displayName = fallbackName

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (typeof type.displayName === 'string') {
    displayName = type.displayName
  } else if (typeof type.name === 'string' && type.name !== '') {
    displayName = type.name
  }

  cachedDisplayNames.set(type, displayName)
  return displayName
}
