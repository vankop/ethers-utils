import { Table } from 'console-table-printer';
import { keyValueOptionsToObject } from '../cli';
import {
  transactions,
  intersection as transactionsIntersection,
  ImprovedTransactions
} from '../transactions';
import { amount } from '../console/amount';
import { txhash, address as etherscanAddress } from '../console/etherscan';
import { address } from '../console/zerion';
import { format } from 'date-fns';
import { bold } from '../console/font';
import { columns } from '../console/format';

const [, , , action, arg0, ...options] = process.argv;
const COLORS = [31, 33, 32, 36, 34, 35];

function printTable(
  type: string,
  events: ImprovedTransactions[],
  withColors = false,
  withTimestamps = false
) {
  const tableView = new Table({ charLength: { ['\x1B']: 3 } });
  if (type !== 'all') {
    tableView.addColumn('address');
  } else {
    tableView.addColumn('from').addColumn('to');
  }
  tableView.addColumn('amount').addColumn('txHash');
  if (withTimestamps) {
    tableView.addColumn('time');
  }

  const sortedEvents = withColors
    ? events.sort(({ from: f0, to: t0 }, { from: f1, to: t1 }) => {
        const a = type === 'buy' ? t0 : f0;
        const b = type === 'buy' ? t1 : f1;
        return a.localeCompare(b);
      })
    : events;

  for (let i = 0; i < sortedEvents.length; i++) {
    const { from, to, amount: a, hash, timestamp } = sortedEvents[i];
    const data: any = {
      amount: amount(a),
      txHash: txhash(hash)
    };
    if (timestamp) {
      data.time = format(timestamp, 'HH:mm:ss dd.MM');
    }
    if (type === 'all') {
      data.from = withColors
        ? `\x1b[${COLORS[i % COLORS.length]}m${etherscanAddress(from)}\x1b[0m`
        : from;
      data.to = withColors
        ? `\x1b[${COLORS[i % COLORS.length]}m${etherscanAddress(to)}\x1b[0m`
        : to;
    } else {
      const addr = etherscanAddress(type === 'buy' ? to : from);
      data.address = withColors
        ? `\x1b[${COLORS[i % COLORS.length]}m${addr}\x1b[0m`
        : addr;
    }

    tableView.addRow(data);
  }

  tableView.printTable();
  console.log(`Count: ${events.length}`);
}

async function list() {
  if (!arg0) throw new Error('Span name as argument expected!');

  const { type } = keyValueOptionsToObject(options);
  switch (type) {
    case 'sell':
    case 'buy':
      break;
    default:
      throw new Error(
        'Transaction type is wrong! Supported values are "buy","sell"'
      );
  }
  const events = await transactions(arg0, type, false);
  printTable(type, events);
}

async function intersection() {
  let opts = options;
  let type: 'buy' | 'sell';
  if (opts[opts.length - 1].indexOf('=') > -1) {
    let i = opts.length;
    while (i > 0 && opts[--i].indexOf('=') > -1);
    const { type: t } = keyValueOptionsToObject(opts.slice(i + 1));
    if (t !== 'buy' && t !== 'sell')
      throw new Error('Should provide type. Like "type=buy"');
    type = t;
    opts = options.slice(0, i + 1);
  } else {
    throw new Error('Should provide type. Like "type=buy"');
  }
  if (!arg0 || opts.length < 1)
    throw new Error('Should have at least 2 spans!');
  const spans = [arg0, ...opts];
  const result = await transactionsIntersection(spans, type, false);

  if (!result) {
    console.log(bold('No match was found!'));
    return;
  }

  const [addresses, map] = result;

  console.log(`${bold(`${addresses.size} Wallets`)}:`);
  columns(
    Array.from(addresses).map((addr) => address(addr)),
    3
  );
  for (const [pair, trs] of map) {
    console.log(`\n\nPair: ${bold(pair)}`);
    printTable(type, trs, false);
  }
}

export function exec(): Promise<any> {
  switch (action) {
    case 'list':
      return list();
    case 'intersection':
      return intersection();
    default:
      throw new Error(
        `${JSON.stringify(action)} action is not exists in transactions script!`
      );
  }
}
