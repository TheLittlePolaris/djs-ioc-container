import { Collection } from 'discord.js';

import { IEntryComponent, ConstructorType } from '../../interfaces';

export type EntryInstance<T extends ConstructorType<any>> = InstanceType<T>;

export class ComponentsContainer {
  private readonly _instances: Collection<string, InstanceType<any>> = new Collection<
    string,
    InstanceType<any>
  >();
  private _entryComponent: ConstructorType<IEntryComponent> = null;
  public get components() {
    return this._instances;
  }

  public get entryComponent(): ConstructorType<IEntryComponent> {
    return this._entryComponent;
  }
  public setEntryComponent(component: ConstructorType<IEntryComponent>) {
    this._entryComponent = component;
  }
  public get entryInstance(): EntryInstance<ConstructorType<IEntryComponent>> {
    return this._instances.get(this.entryComponent.name);
  }

  public addInstance<T>(
    target: ConstructorType<T>,
    compiledInstance: InstanceType<ConstructorType<T>>
  ) {
    this.components.set(target.name, compiledInstance);
  }

  public getInstance<T = any>(
    forTarget: ConstructorType<T> | string
  ): InstanceType<ConstructorType<T>> {
    return this._instances.get(typeof forTarget === 'string' ? forTarget : forTarget.name);
  }
}
