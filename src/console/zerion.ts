import { hyperLink } from './utils';

export function address(addr: string) {
  return hyperLink(`https://app.zerion.io/${addr}`, addr);
}
