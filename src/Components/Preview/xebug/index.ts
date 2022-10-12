import { uuid, each, Emitter } from './lib/util'
import methods, { MethodKey } from './lib/methods'
import connector from './lib/connector'

type DomainMethod = (...args: any[]) => any

export class Xebug extends Emitter {
  private resolves: Map<string, (value?: any) => void> = new Map()
  private domains: Map<string, { [index: string]: DomainMethod }> = new Map()
  constructor() {
    super()
    connector.on('message', (message: any) => {
      console.log('Connector got message', message)
      const parsedMessage = JSON.parse(message)
      const resolve = this.resolves.get(parsedMessage.id)
      if (resolve) {
        resolve(parsedMessage.result)
      }

      if (!parsedMessage.id) {
        const [name, method] = parsedMessage.method.split('.')
        const domain = this.domains.get(name)
        if (domain) {
          domain.emit(method, parsedMessage.params)
        }
      }
      this.emit('message', message)
    })

    this.initDomains()
  }
  domain(name: string) {
    return this.domains.get(name)
  }
  sendMessage(method: string, params: any = {}) {
    const id = uuid()
    this.sendRawMessage(
      JSON.stringify({
        id,
        method,
        params,
      })
    )
    return new Promise((resolve) => {
      this.resolves.set(id, resolve)
    })
  }
  async sendRawMessage(message: string) {
    const parsedMessage = JSON.parse(message)
    const { method, params, id } = parsedMessage
    const resultMsg: any = {
      id,
    }

    try {
      resultMsg.result = await this.callMethod(method, params)
    } catch (e) {
      resultMsg.error = {
        message: (e as any).message,
      }
    }
    connector.emit('message', JSON.stringify(resultMsg))
  }
  private initDomains() {
    const domains = this.domains

    each(methods, (fn: any, key: string) => {
      const [name, method] = key.split('.')
      let domain = domains.get(name)
      if (!domain) {
        domain = {}
        Emitter.mixin(domain)
      }
      domain[method] = fn
      domains.set(name, domain)
    })
  }
  private async callMethod(method: MethodKey, params: any) {
    if (methods[method]) {
      return methods[method](params) || {}
    } else {
      throw Error(`${method} is not implemented`)
    }
  }
}
