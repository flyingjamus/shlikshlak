export class TypedEventEmitter<TEvents extends Record<string, any>> {
  constructor(
    private emitter: {
      emit: (eventName: string, ...args: any[]) => void
      on: (eventName: string, handler: (...args: any) => void) => void
      off: (eventName: string, handler: (...args: any) => void) => void
    }
  ) {}

  emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]) {
    this.emitter.emit(eventName, ...(eventArg as []))
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.emitter.on(eventName, handler as any)
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.emitter.off(eventName, handler as any)
  }
}

