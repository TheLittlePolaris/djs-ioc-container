import { isArray } from 'lodash';

export function toArray(value): any[] {
  return isArray(value) ? value : [value];
}

