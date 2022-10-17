import {
  EVENT_HANDLER,
  EVENT_HANDLER_CONFIG,
  DiscordEvent,
  DiscordEventConfig
} from '../../constants';
import { ConstructorType } from '../../interfaces';

export function OnEvent(event: DiscordEvent, config?: DiscordEventConfig[DiscordEvent]) {
  return (target: ConstructorType<any>) => {
    Reflect.defineMetadata(EVENT_HANDLER, event, target);
    if (config) Reflect.defineMetadata(EVENT_HANDLER_CONFIG, config, target);
  };
}
