import { Collection } from 'discord.js';

import { IProvider, ConstructorType, IProviderValue } from '../../interfaces';

export class ProvidersContainer {
  private readonly _providers: Collection<string, IProviderValue> = new Collection<string, any>();

  public get providers() {
    return this._providers;
  }

  public setValueProvider(module: ConstructorType<any>, provider: IProvider, value: any) {
    provider['_value' as any] = value; // this is the only place that assign the value
    Object.freeze(provider);
    this._providers.set(
      this.providerNameConstructor(module, provider.provide),
      provider as IProviderValue
    );
  }

  public getProvider(forModule: ConstructorType<any>, parameterName: string): IProviderValue {
    const provider = this._providers.get(this.providerNameConstructor(forModule, parameterName));
    return Object.assign({}, provider, { getValue: () => provider._value });
  }

  private providerNameConstructor(module: ConstructorType<any>, parameterName: string) {
    return `${module.name}_${parameterName}`;
  }

  public clear() {
    this._providers.clear();
  }
}
