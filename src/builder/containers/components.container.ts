import { Collection } from 'discord.js';

import { EntryComponent, ConstructorType } from '../../interfaces';

export type EntryInstance<T extends ConstructorType<any>> = InstanceType<T>;

export class ComponentsContainer {
  private readonly _instances: Collection<string, InstanceType<any>> = new Collection<
    string,
    InstanceType<any>
  >();
  private _entryComponent: ConstructorType<EntryComponent> = null;
  public get components() {
    return this._instances;
  }

  public get entryComponent(): ConstructorType<EntryComponent> {
    return this._entryComponent;
  }
  public setEntryComponent(component: ConstructorType<EntryComponent>) {
    this._entryComponent = component;
  }
  public get entryInstance(): EntryInstance<ConstructorType<EntryComponent>> {
    return this._instances.get(this.entryComponent.name);
  }

  public addInstance<T>(target: ConstructorType<T>, compiledInstance: InstanceType<ConstructorType<T>>) {
    this.components.set(target.name, compiledInstance);
  }

  public getInstance<T = any>(forTarget: ConstructorType<T>): InstanceType<ConstructorType<T>> {
    return this._instances.get(forTarget.name);
  }
}
