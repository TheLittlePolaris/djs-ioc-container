import { getPropertyKey, ModuleMetadata } from '../../constants';
import { RecursiveContainerFactory } from '../../builder/container-factory';
import { GenericClassDecorator, ModuleOption, ConstructorType } from '../../interfaces';

export function YuiModule<T = any>(options: ModuleOption): GenericClassDecorator<ConstructorType<T>> {
  const propertyKeys = Object.keys(options);
  propertyKeys.map((key: string) => {
    if (key === 'entryComponent') return;

    if (!options[key].length) return delete options[key];

    options[key].map((record) => {
      if (!record)
        throw new Error(`Cannot resolve ${record} of property ${key} in module metadata`);
    });
  });
  return (target: ConstructorType<any>) => {
    for (const property in options) {
      if (!Object.prototype.hasOwnProperty.call(options, property)) continue;

      if (property === 'entryComponent') {
        if (RecursiveContainerFactory.entryDetected)
          throw new Error(`Multiple entry detected: ${target.name}`);

        RecursiveContainerFactory.entryDetected = true;
      }

      if (options.hasOwnProperty(property))
        Reflect.defineMetadata(
          getPropertyKey(property as ModuleMetadata),
          options[property],
          target
        );
    }
  };
}
