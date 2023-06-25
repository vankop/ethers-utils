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
import { isBuyLike, TransactionType } from './type';

export type ImprovedTransactions = Transaction & { timestamp?: number };

export async function transactions(
  spanName: string,
  type: TransactionType,
  timestamps: boolean,
  silent: boolean
): Promise<ImprovedTransactions[]> {
  const {
    pairName,
    pairAddress,
    contractAddress,
    blockSpan: [start, end]
  } = getSpanDataForTransaction(spanName);
  const provider = createProvider();
  console.log(`Span from ${block(start)} to ${block(end)}`);

  let loader = `Loading ${pairName} ${type} transactions..`;
  const endLoading = silent ? () => {} : spinner(() => loader);
  try {
    let events = await allTransactionsInRange(
      start,
      end,
      contractAddress,
      pairAddress,
      provider,
      type
    );

    loader = `${events.length} addresses found. Checking bots/contracts..`;

    const contracts = new Set<string>();
    const promises = [];
    for (const { from, to } of events) {
      const addr = isBuyLike(type) ? to : from;
      promises.push(
        (async () => {
          if (await isContract(addr, provider)) {
            contracts.add(addr);
          }
        })()
      );
    }

    await Promise.all(promises);
    events = events.filter(({ from, to }) => {
      const addr = isBuyLike(type) ? to : from;
      return !contracts.has(addr);
    });

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
  spans: [string, TransactionType][],
  timestamps: boolean,
  silent = false
): Promise<
  | [Set<string>, Map<string, Map<TransactionType, ImprovedTransactions[]>>]
  | null
> {
  const provider = createProvider();
  const data: Map<string, Map<string, Transaction[]>> = new Map();
  let addressSet: Set<string> = new Set();
  let loader = '';

  const addEventInData = (
    spanName: string,
    addr: string,
    event: Transaction
  ) => {
    let entry = data.get(addr);
    if (entry) {
      const entry2 = entry.get(spanName);
      if (entry2) {
        entry2.push(event);
      } else {
        entry.set(spanName, [event]);
      }
    } else {
      const e: Map<string, Transaction[]> = new Map();
      e.set(spanName, [event]);
      data.set(addr, e);
    }
  };

  const endLoading = silent ? () => {} : spinner(() => loader);
  for (const span of spans.slice(0, 2)) {
    const i = spans.indexOf(span);
    const [spanName, type] = span;
    const {
      pairName,
      pairAddress,
      contractAddress,
      blockSpan: [start, end]
    } = getSpanDataForTransaction(spanName);
    loader = `${i + 1}/${
      spans.length
    } Loading ${pairName} ${type} transactions. From block ${block(
      start
    )} to ${block(end)}`;
    try {
      const events = await allTransactionsInRange(
        start,
        end,
        contractAddress,
        pairAddress,
        provider,
        type
      );
      for (const event of events) {
        const addr = isBuyLike(type) ? event.to : event.from;
        addEventInData(`${spanName}|${type}`, addr, event);
        const entry = data.get(addr);
        if (entry && entry.size > 1) addressSet.add(addr);
      }
    } catch (e) {
      endLoading();
      throw e;
    }
  }

  for (const span of spans.slice(2)) {
    const i = spans.indexOf(span);
    const [spanName, type] = span;
    const {
      pairName,
      pairAddress,
      contractAddress,
      blockSpan: [start, end]
    } = getSpanDataForTransaction(spanName);
    loader = `${i + 1}/${
      spans.length
    } Loading ${pairName} ${type} transactions. Max possible wallets ${
      addressSet.size
    }`;

    try {
      const newAddressSet = new Set<string>();
      const events = await allTransactionsInRange(
        start,
        end,
        contractAddress,
        pairAddress,
        provider,
        type
      );
      for (const event of events) {
        const addr = isBuyLike(type) ? event.to : event.from;
        if (!addressSet.has(addr)) continue;
        newAddressSet.add(addr);
        addEventInData(`${spanName}|${type}`, addr, event);
      }
      addressSet = newAddressSet;
    } catch (e) {
      endLoading();
      throw e;
    }
  }

  if (addressSet.size === 0) {
    endLoading();
    return null;
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
  const r = new Map<string, Map<TransactionType, ImprovedTransactions[]>>();
  for (const addr of addressSet) {
    const spans = data.get(addr);

    if (!timestamps) {
      for (const [span, trs] of spans!) {
        const [spanName, type] = span.split('|') as [string, TransactionType];
        let entry = r.get(spanName);
        if (!entry) {
          entry = new Map<TransactionType, ImprovedTransactions[]>();
          entry.set(type, trs.slice());
          r.set(spanName, entry);
        } else {
          const entry2 = entry.get(type);
          if (entry2) {
            entry.set(type, [...entry2, ...trs]);
          } else {
            entry.set(type, trs.slice());
          }
        }
      }
    } else {
      const entries = Array.from(spans!.entries());
      let timestamps = await Promise.all(
        entries.map(([, trs]) => findTimestampOfTransactions(trs, provider))
      );

      for (let i = 0; i < entries.length; i++) {
        const [span, trs] = entries[i];
        const ts = timestamps[i];
        const [spanName, type] = span.split('|') as [string, TransactionType];
        let arr: any[];
        let entry = r.get(spanName);
        if (!entry) {
          entry = new Map<TransactionType, ImprovedTransactions[]>();
          entry.set(type, (arr = []));
          r.set(spanName, entry);
        } else {
          const entry2 = entry.get(type);
          if (entry2) {
            arr = entry2;
          } else {
            entry.set(type, (arr = []));
          }
        }
        for (let j = 0; j < trs.length; j++) {
          arr.push({
            ...trs[j],
            timestamp: ts[j]
          });
        }
      }
    }
  }

  endLoading();
  return [addressSet, r];
}
