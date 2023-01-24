/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BaseLanguageClient, MessageTransports } from 'vscode-languageclient/lib/common/client.js'
import { RegistrationParams, UnregistrationParams } from 'vscode-languageclient'
import { LanguageClientOptions } from 'monaco-languageclient'

export interface IConnectionProvider {
  get(encoding: string): Promise<MessageTransports>
}
export interface MonacoLanguageClientOptions {
  name: string
  id?: string
  clientOptions: LanguageClientOptions
  connectionProvider: IConnectionProvider
}
export class MonacoLanguageClient extends BaseLanguageClient {
  protected readonly connectionProvider: IConnectionProvider

  constructor({ id, name, clientOptions, connectionProvider }: MonacoLanguageClientOptions) {
    super(id || name.toLowerCase(), name, clientOptions)
    this.connectionProvider = connectionProvider

    // Hack because vscode-language client rejects the whole registration block if one capability registration has no associated client feature registered
    // Some language servers still send the registration even though the client says it doesn't support it
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const originalHandleRegistrationRequest: (params: RegistrationParams) => Promise<void> =
      this['handleRegistrationRequest'].bind(this)
    // eslint-disable-next-line @typescript-eslint/dot-notation
    this['handleRegistrationRequest'] = (params: RegistrationParams) => {
      originalHandleRegistrationRequest({
        ...params,
        registrations: params.registrations.filter(
          (registration) => this.getFeature(<any>registration.method) != null
        ),
      })
    }
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const originalHandleUnregistrationRequest: (params: UnregistrationParams) => Promise<void> =
      this['handleUnregistrationRequest'].bind(this)
    // eslint-disable-next-line @typescript-eslint/dot-notation
    this['handleUnregistrationRequest'] = (params: UnregistrationParams) => {
      originalHandleUnregistrationRequest({
        ...params,
        unregisterations: params.unregisterations.filter(
          (unregistration) => this.getFeature(<any>unregistration.method) != null
        ),
      })
    }
  }

  protected createMessageTransports(encoding: string): Promise<MessageTransports> {
    return this.connectionProvider.get(encoding)
  }

  protected getLocale(): string {
    return navigator.language || 'en-US'
  }

  protected override registerBuiltinFeatures() {}

  public registerTextDocumentSaveFeatures() {}

  public registerConfigurationFeatures() {}

  public registerProgressFeatures() {}
}
