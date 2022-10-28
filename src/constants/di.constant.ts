export const DESIGN_TYPE = 'design:type';
export const PARAMTYPES_METADATA = 'design:paramtypes';

export const MODULE_METADATA_KEY_PREFIX = 'self:metadata';
export const INJECTABLE_METADATA = 'injectable-metadata';
export const SELF_DECLARED_DEPS_METADATA = 'self:paramtypes';
export const OPTIONAL_DEPS_METADATA = 'optional:paramtypes';
export const PROPERTY_DEPS_METADATA = 'self:properties_metadata';

export const METHOD_PARAMS_METADATA_INTERNAL = 'method:params:internal';

export const CUSTOM_INTERCEPTOR = 'design:custom:interceptor';
export const INTERCEPTOR_TARGET = 'self:interceptor_target';

export enum InjectToken {
  ClientOptions = '_ClientOptions',
  CommandParser = '_CommandParser',
  GlobalInterceptors = '_GlobalInterceptors',
  AppConfig = '_AppConfig',

  // when?
  REDIS_CONFIG = '_RedisConfig'
}

export const EVENT_HANDLER = 'self:event_handler';
export const EVENT_HANDLER_CONFIG = 'self:event_handler_config';
export const COMMAND_HANDLER = 'self:command_handler';

export enum ModuleMetadata {
  MODULES = 'modules',
  PROVIDERS = 'providers',
  COMPONENTS = 'components',
  INTERCEPTOR = 'interceptors'
}

export const getPropertyKey = (key: ModuleMetadata) => `${MODULE_METADATA_KEY_PREFIX}:${key}`;
