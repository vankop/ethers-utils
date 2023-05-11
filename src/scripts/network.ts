import {
  addNetwork,
  useNetwork,
  renderUsedNetworkInfo,
  renderAllNetworks
} from '../network';
import { keyValueOptionsToObject } from '../cli';

const [, , , action, name, ...configOptions] = process.argv;

function use() {
  useNetwork(name);
  console.log('Used ⇩ ⇩ ⇩');
  console.log(renderUsedNetworkInfo());
}

function add() {
  const config = keyValueOptionsToObject(configOptions);
  addNetwork(name, config);
  console.log('Added ⇩ ⇩ ⇩');
  console.log(renderUsedNetworkInfo());
}

function list() {
  console.log(renderAllNetworks());
}

export function exec() {
  switch (action) {
    case 'use':
      return use();
    case 'add':
      return add();
    case 'list':
      return list();
    default:
      throw new Error(
        `${JSON.stringify(action)} action is not exists in network script!`
      );
  }
}
