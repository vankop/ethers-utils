import { Table } from 'console-table-printer';
import { formatInTimeZone } from 'date-fns-tz';
import { keyValueOptionsToObject } from '../cli';
import { transactions } from '../transactions';
import { amount } from '../console/amount';
import { address, txhash } from '../console/etherscan';

const [, , , action, arg0, ...options] = process.argv;

async function view() {
  if (!arg0) throw new Error('Span name as argument expected!');

  const { type = 'all' } = keyValueOptionsToObject(options);
  switch (type) {
    case 'all':
    case 'sell':
    case 'buy':
      break;
    default:
      throw new Error(
        'Transaction type is wrong! Supported values are "buy","sell","all"'
      );
  }
  const events = await transactions(arg0, type);

  const tableView = new Table({ charLength: { ['\x1B']: 3 } });
  if (type === 'buy' || type === 'all') {
    tableView.addColumn('to');
  }
  if (type === 'sell' || type === 'all') {
    tableView.addColumn('from');
  }

  tableView.addColumn('amount').addColumn('time').addColumn('txHash');

  for (const { from, to, amount: a, hash, timestamp } of events) {
    const data: any = {
      amount: amount(a),
      txHash: txhash(hash),
      time: formatInTimeZone(timestamp, 'UTC', 'HH:mm:ss dd.MM')
    };
    if (type === 'buy' || type === 'all') {
      data.to = address(to);
    }
    if (type === 'sell' || type === 'all') {
      data.from = address(from);
    }
    tableView.addRow(data);
  }
  tableView.printTable();
  console.log(`Count: ${events.length}`);
}

export function exec(): Promise<any> {
  switch (action) {
    case 'view':
      return view();
    default:
      throw new Error(
        `${JSON.stringify(action)} action is not exists in transactions script!`
      );
  }
}
