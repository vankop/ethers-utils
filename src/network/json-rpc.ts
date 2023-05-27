import { JsonRpcProvider } from 'ethers';

export function createProvider(option: string) {
  return new JsonRpcProvider(option) as any;
}

export function renderProviderInfo(option: string) {
  return `\u001b[1m\x1b[31m${option}\x1b[0m\u001b[0m`;
}
