import { InfuraProvider } from 'ethers';

export function createProvider(option: string) {
  return new InfuraProvider('mainnet', option) as any;
}

export function renderProviderInfo(option: string) {
  return `\u001b[1m\x1b[31mwss://mainnet.infura.io/ws/v3/${option}\x1b[0m\u001b[0m`;
}
