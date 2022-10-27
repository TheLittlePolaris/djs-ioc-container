import { Collection } from 'discord.js';

import { IEntryComponent, ConstructorType } from '../../interfaces';

export type Instance<T extends ConstructorType<any>> = InstanceType<T>;

export class ModulesContainer {
  private readonly _modules: Collection<string, ConstructorType<any>> = new Collection<string, ConstructorType<any>>();
  private _entryComponentType: ConstructorType<IEntryComponent> = null;

  public get modules() {
    return this._modules;
  }

  public get entryComponent(): ConstructorType<IEntryComponent> {
    return this._entryComponentType;
  }
  public setEntryComponent(component: ConstructorType<IEntryComponent>) {
    this._entryComponentType = component;
  }

  public importModules(modules: ConstructorType<any>[]) {
    modules.map((module) => this.addModule(module));
  }
  private addModule(module: ConstructorType<any>) {
    this._modules.set(module.name, module);
  }

  public clear() {
    this._modules.clear();
  }
}
