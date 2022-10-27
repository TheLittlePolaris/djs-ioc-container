import { COMMAND_HANDLER } from '../../constants';
import { ICommandHandlerMetadata, Prototype } from '../../interfaces';
import { ExecutionContext } from '../../execution-context';
import { createMethodDecorator } from '../generators';

export const EventHandler = createMethodDecorator(
  (context: ExecutionContext) => context,
  (target: Prototype, propertyKey: string) => {
    let commands: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || [];
    commands = [...commands, { propertyKey, command: 'default' }];
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor);
  }
);
