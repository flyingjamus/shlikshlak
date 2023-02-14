export default class EventEmitter<Events extends Record<string, any>> {
  listenersMap: Map<string, Array<(...args: Array<any>) => any>> = new Map()

  addListener<Event extends keyof Events>(event: Event, listener: (...v: any) => any): void {
    const listeners = this.listenersMap.get(event)
    if (listeners === undefined) {
      this.listenersMap.set(event, [listener])
    } else {
      const index = listeners.indexOf(listener)
      if (index < 0) {
        listeners.push(listener)
      }
    }
  }

  emit<Event extends keyof Events>(event: Event, ...args: any): void {
    const listeners = this.listenersMap.get(event)

    if (listeners !== undefined) {
      if (listeners.length === 1) {
        // No need to clone or try/catch
        const listener = listeners[0]
        listener.apply(null, args)
      } else {
        let didThrow = false
        let caughtError = null
        const clonedListeners = Array.from(listeners)

        for (let i = 0; i < clonedListeners.length; i++) {
          const listener = clonedListeners[i]

          try {
            listener.apply(null, args)
          } catch (error) {
            if (caughtError === null) {
              didThrow = true
              caughtError = error
            }
          }
        }

        if (didThrow) {
          throw caughtError
        }
      }
    }
  }

  removeAllListeners(): void {
    this.listenersMap.clear()
  }

  removeListener(event: keyof Events, listener: (...args: Array<any>) => any): void {
    const listeners = this.listenersMap.get(event)

    if (listeners !== undefined) {
      const index = listeners.indexOf(listener)

      if (index >= 0) {
        listeners.splice(index, 1)
      }
    }
  }
}
