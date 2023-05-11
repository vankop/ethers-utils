import { Table } from 'console-table-printer';
import { createProvider } from './network';
import { findBlockByTimestamp } from './utils/find-block-by-timestamp';
import { amount } from './console/amount';
import { allTransactionsInRange } from './utils/all-transactions-in-range';
import { address, txhash } from './console/etherscan';

const BUTTER_TOKEN_CONTRACT = '0x0d248ce39e26fb00f911fb1e7a45a00d8c94341c';
const ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 amount)'
];

async function main() {
  const provider = createProvider();
  const block = await findBlockByTimestamp(1683504052, provider);
  const parsed = await allTransactionsInRange(
    block.number,
    block.number + 100,
    BUTTER_TOKEN_CONTRACT,
    ABI,
    provider
  );

  const tableView = new Table({ charLength: { ['\x1B']: 3 } });
  tableView
    .addColumn('from')
    .addColumn('to')
    .addColumn('amount')
    .addColumn('txHash');

  for (const { from, to, amount: a, hash } of parsed) {
    tableView.addRow({
      amount: amount(a),
      from: address(from),
      to: address(to),
      txHash: txhash(hash)
    });
  }
  tableView.printTable();

  await provider.destroy();
}

main();
