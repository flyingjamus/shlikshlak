;(async () => {
  window.__DEV__ = false
  const { initialize, activate } = await import('../ReactDevtools/react-devtools-inline/backend')
  initialize(window)
  activate(window)
})()
