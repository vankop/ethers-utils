import { block } from '../console/etherscan';
import { spinner } from '../utils';
import {
  allTransactionsInRange,
  Transaction
} from './all-transactions-in-range';
import { createProvider } from '../network';
import { getSpanDataForTransaction } from '../pairs';
import { findTimestampOfTransactions } from './find-timestamp-of-transactions';

const ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 amount)'
];

export async function transactions(
  spanName: string,
  type: 'buy' | 'sell' | 'all'
): Promise<(Transaction & { timestamp: number })[]> {
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
  } catch (e) {
    endLoading();
    throw e;
  }
}
