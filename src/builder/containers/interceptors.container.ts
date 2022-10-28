import { Collection } from 'discord.js';

import { ConstructorType } from '../../interfaces';

export class InterceptorsContainer {
  private readonly _interceptors: Collection<string, InstanceType<ConstructorType<any>>> =
    new Collection<string, InstanceType<ConstructorType<any>>>();

  public get interceptors() {
    return this._interceptors;
  }

  public addInterceptor<T>(target: ConstructorType<T>, instance: InstanceType<ConstructorType<T>>) {
    this.interceptors.set(target.name, instance);
  }

  public getInterceptorInstance<T extends ConstructorType<any>>(
    interceptorName: string
  ): InstanceType<T> {
    return this._interceptors.get(interceptorName);
  }

  public clear() {
    this.interceptors.clear();
  }
}
