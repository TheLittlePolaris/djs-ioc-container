import { Collection } from 'discord.js';

import { Provider, ConstructorType } from '../../interfaces';

export class ProvidersContainer {
  private readonly _providers: Collection<string, Provider<any>> = new Collection<string, any>();

  public get providers() {
    return this._providers;
  }
  public setValueProvider(module: ConstructorType<any>, provider: Provider) {
    this._providers.set(this.providerNameConstructor(module, provider.provide), provider);
  }

  public getProvider(forModule: ConstructorType<any>, parameterName: string) {
    return this._providers.get(this.providerNameConstructor(forModule, parameterName));
  }

  private providerNameConstructor(module: ConstructorType<any>, parameterName: string) {
    return `${module.name}_${parameterName}`;
  }

  public clear() {
    this._providers.clear();
  }
}
