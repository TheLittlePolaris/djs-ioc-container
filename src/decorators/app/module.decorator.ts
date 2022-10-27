import { getPropertyKey, ModuleMetadata } from '../../constants';
import { GenericClassDecorator, IModuleOption, ConstructorType } from '../../interfaces';

export function Module(options: IModuleOption): GenericClassDecorator<ConstructorType> {
  const propertyKeys = Object.keys(options);
  propertyKeys.forEach((key: string) => {
    if (!options[key].length) return delete options[key];

    options[key].forEach((record) => {
      if (!record)
        throw new Error(`Cannot resolve ${record} of property ${key} in module metadata`);
    });
  });
  return (target: ConstructorType) => {
    for (const property in options) {
      if (!Object.prototype.hasOwnProperty.call(options, property)) continue;

      if (options.hasOwnProperty(property))
        Reflect.defineMetadata(
          getPropertyKey(property as ModuleMetadata),
          options[property],
          target
        );
    }
  };
}
