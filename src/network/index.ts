import {
  createProvider as createInfuraProvider,
  renderProviderInfo as renderInfuraProviderInfo
} from './infura';
import { withConfig } from '../configs';
import { WebSocketProvider } from 'ethers';

const NETWORK_FILENAME = 'network.json';

export function addNetwork(
  name: string,
  data: Record<string, string> | string
) {
  withConfig(NETWORK_FILENAME, (config) => (config[name] = data));
}

export function useNetwork(name: string) {
  withConfig(NETWORK_FILENAME, (config) => {
    if (!config[name])
      throw new Error(`Missing ${JSON.stringify(name)} network configuration!`);
    config.use = name;
  });
}

function renderNetworkDataInfo(data: string | Record<string, string>) {
  if (typeof data === 'string') return 'custom node not supported yet!';
  if ('infura' in data) {
    return `\x1b[32mInfura\x1b[0m. ${renderInfuraProviderInfo(data.infura)}`;
  }
}

export function renderUsedNetworkInfo() {
  return withConfig(
    NETWORK_FILENAME,
    (config) => {
      if (!config.use)
        return 'No used network! run "network use <name>" to use.';
      const data = config[config.use];
      if (!data) return 'No provider config!';
      const r = renderNetworkDataInfo(data);
      if (r) return r;

      return 'No network config!';
    },
    true
  );
}

export function renderAllNetworks() {
  return withConfig(
    NETWORK_FILENAME,
    (config) => {
      const keys = Object.keys(config);
      const data = [];
      for (const key of keys) {
        if (key === 'use') continue;
        const used = key === config.use;
        const str = renderNetworkDataInfo(config[key]);
        data.push(`${used ? ' >  ' : '   '}${str}`);
      }
      return data.join('\n');
    },
    true
  );
}

let _provider: WebSocketProvider;

export function createProvider() {
  if (_provider) return _provider;
  _provider = withConfig(
    NETWORK_FILENAME,
    (config) => {
      if (!config.use) throw new Error('No network config!');
      const data = config[config.use];
      if (!data) throw new Error('No provider config!');
      if (typeof data === 'string')
        throw new Error('custom node not supported yet!');
      if ('infura' in data) {
        return createInfuraProvider(data.infura);
      }
      throw new Error('No configuration was found for network!');
    },
    true
  );
  return _provider;
}

export function destroy() {
  if (_provider) return _provider.destroy();
  return Promise.resolve();
}
