import { block } from '../console/etherscan';
import { spinner } from '../utils';
import {
  allTransactionsInRange,
  Transaction
} from './all-transactions-in-range';
import { createProvider } from '../network';
import { getSpanDataForTransaction } from '../pairs';
import { findTimestampOfTransactions } from './find-timestamp-of-transactions';
import { isContract } from './is-contract';

export type ImprovedTransactions = Transaction & { timestamp?: number };

const ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 amount)'
];

export async function transactions(
  spanName: string,
  type: 'buy' | 'sell' | 'all',
  timestamps: boolean
): Promise<ImprovedTransactions[]> {
  const {
    pairName,
    pairAddress,
    contractAddress,
    blockSpan: [start, end]
  } = getSpanDataForTransaction(spanName);
  const provider = createProvider();
  console.log(`Span from ${block(start)} to ${block(end)}`);

  let loader = `Loading ${pairName} ${type} transactions for span..`;
  const endLoading = spinner(() => loader);
  try {
    const events = await allTransactionsInRange(
      start,
      end,
      contractAddress,
      ABI,
      provider,
      type === 'buy'
        ? { from: pairAddress }
        : type === 'sell'
        ? { to: pairAddress }
        : undefined
    );
    if (timestamps) {
      loader = `Loading timestamps..`;
      const timestamps = await findTimestampOfTransactions(events, provider);
      endLoading();
      const data = [];
      for (let i = 0; i < events.length; i++) {
        data.push({
          ...events[i],
          timestamp: timestamps[i]
        });
      }
      return data;
    }
    endLoading();
    return events;
  } catch (e) {
    endLoading();
    throw e;
  }
}

export async function intersection(
  spans: string[],
  type: 'buy' | 'sell',
  timestamps: boolean
): Promise<[Set<string>, Map<string, ImprovedTransactions[]>] | null> {
  const provider = createProvider();
  const data: Map<string, Map<string, Transaction[]>> = new Map();
  const addressSet: Set<string> = new Set();
  let loader = '';
  const endLoading = spinner(() => loader);
  for (const span of spans) {
    const i = spans.indexOf(span);
    const {
      pairName,
      pairAddress,
      contractAddress,
      blockSpan: [start, end]
    } = getSpanDataForTransaction(span);
    loader = `${i + 1}/${
      spans.length
    } Loading ${pairName} ${type} transactions for span. From block ${block(
      start
    )} to ${block(end)}`;
    try {
      const events = await allTransactionsInRange(
        start,
        end,
        contractAddress,
        ABI,
        provider,
        type === 'buy' ? { from: pairAddress } : { to: pairAddress }
      );
      for (const event of events) {
        const addr = type == 'buy' ? event.to : event.from;
        let entry = data.get(addr);
        if (entry) {
          const entry2 = entry.get(pairName);
          if (entry2) {
            entry2.push(event);
          } else {
            entry.set(pairName, [event]);
          }
          if (entry.size > 1) addressSet.add(addr);
        } else {
          const e: Map<string, Transaction[]> = new Map();
          e.set(pairName, [event]);
          data.set(addr, e);
        }
      }
    } catch (e) {
      endLoading();
      throw e;
    }
  }

  loader = `${addressSet.size} addresses found. Checking bots/contracts..`;

  const promises = [];
  for (const addr of addressSet) {
    promises.push(
      (async () => {
        if (await isContract(addr, provider)) {
          addressSet.delete(addr);
        }
      })()
    );
  }

  await Promise.all(promises);

  if (addressSet.size === 0) {
    endLoading();
    return null;
  }

  loader = `${addressSet.size} wallets found. Loading timestamps..`;
  const r = new Map<string, ImprovedTransactions[]>();
  for (const addr of addressSet) {
    const pairs = data.get(addr);

    if (!timestamps) {
      for (const [pair, trs] of pairs!) {
        let entry = r.get(pair);
        if (!entry) {
          entry = trs.slice();
        } else {
          entry = [...entry, ...trs];
        }
        r.set(pair, entry);
      }
    } else {
      const entries = Array.from(pairs!.entries());
      let timestamps = await Promise.all(
        entries.map(([, trs]) => findTimestampOfTransactions(trs, provider))
      );

      for (let i = 0; i < entries.length; i++) {
        const [pairName, trs] = entries[i];
        const ts = timestamps[i];
        let entry = r.get(pairName);
        if (!entry) {
          entry = [];
          r.set(pairName, entry);
        }
        for (let j = 0; j < trs.length; j++) {
          entry.push({
            ...trs[j],
            timestamp: ts[j]
          });
        }
      }
    }
  }

  endLoading();
  console.log('');
  return [addressSet, r];
}
