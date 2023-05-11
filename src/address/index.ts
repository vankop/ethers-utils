import { withConfig } from '../configs';
import { address } from '../console/etherscan';
import { Table } from 'console-table-printer';

const ADDRESS_FILENAME = 'address.json';

function aliases(config: Record<string, any>): Record<string, string> {
  return config['alias'] || (config['alias'] = {});
}

export function addAlias(name: string, address: string) {
  withConfig(ADDRESS_FILENAME, (config) => {
    const alias = aliases(config);
    if (alias[name])
      throw new Error(`Alias ${JSON.stringify(name)} already exists!`);
    alias[name] = address;
  });
}

export function removeAlias(name: string) {
  withConfig(ADDRESS_FILENAME, (config) => {
    const alias = aliases(config);
    if (!alias[name])
      throw new Error(`Alias ${JSON.stringify(name)} not found!`);
    delete alias[name];
  });
}

export function viewAllAddresses() {
  return withConfig(
    ADDRESS_FILENAME,
    (config) => {
      const alias = aliases(config);
      const tableView = new Table({ charLength: { ['\x1B']: 3 } });
      tableView.addColumn('alias').addColumn('address');
      for (const [name, addr] of Object.entries(alias)) {
        tableView.addRow({
          alias: name,
          address: address(addr)
        });
      }
      return tableView.render();
    },
    true
  );
}

export function resolveAddress(someSting: string) {
  return withConfig(
    ADDRESS_FILENAME,
    (config) => {
      const alias = aliases(config);
      return alias[someSting] || someSting;
    },
    true
  );
}
