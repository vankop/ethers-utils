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
const COLORS = [31, 33, 32, 36, 34, 35];

function assetType(str: any): str is 'buy' | 'sell' {
  return str === 'buy' || 'sell' === str;
}

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
  const [, , , , arg0, ...options] = process.argv;
  if (!arg0) throw new Error('Span name as argument expected!');

  const { type, timestamp = false } = keyValueOptionsToObject(options);
  if (!assetType(type)) {
    throw new Error(
      'Transaction type is wrong! Supported values are "type=buy","type=sell"'
    );
  }
  const events = await transactions(arg0, type, !!timestamp);
  printTable(type, events);
}

async function intersection() {
  const [, , , , ...options] = process.argv;
  if (options.length < 2) throw new Error('Should have at least 2 spans!');
  const spans = new Map<string, 'buy' | 'sell'>();
  let timestamp = false;
  const {
    type,
    timestamp: ts = false,
    ...rest
  } = keyValueOptionsToObject(options);
  const keys = Object.keys(rest);
  if (keys.length < 2) throw new Error('Should have at least 2 spans!');
  if (!type) {
    if (Object.values(rest).some((r) => r === true))
      throw new Error('Should provide type. Like "type=buy"');
  } else if (!assetType(type)) {
    throw new Error(
      'Transaction type is wrong! Supported values are "type=buy","type=sell"'
    );
  }

  timestamp = !!ts;
  for (const key of keys) {
    const value = rest[key] === true ? type : rest[key];
    if (!assetType(value)) {
      throw new Error(
        'Transaction type is wrong! Supported values are "buy","sell"'
      );
    }
    spans.set(key, value);
  }
  const result = await transactionsIntersection(spans, timestamp);

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
    printTable(spans.get(pair)!, trs, false);
  }
}

export function exec(): Promise<any> {
  const [, , , action] = process.argv;
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
