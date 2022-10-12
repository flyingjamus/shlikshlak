import { Emitter } from './util';
export class Connector extends Emitter {
  trigger(method: string, params: any) {
    this.emit(
      'message',
      JSON.stringify({
        method,
        params,
      })
    );
  }
}

export default new Connector();
