import type { WebSocketProvider } from 'ethers';
import { Transaction } from './all-transactions-in-range';

async function getBlockTimestamp(
  blockNumber: number,
  provider: WebSocketProvider
) {
  const block = await provider.getBlock(blockNumber);
  if (!block) throw new Error(`Block #${blockNumber} not found!`);
  return block.timestamp * 1000;
}

export async function findTimestampOfTransactions(
  transactions: Transaction[],
  provider: WebSocketProvider
): Promise<number[]> {
  const cache = new Map<number, Promise<number>>();
  const data: number[] = new Array(transactions.length).fill(0);
  const promises: Promise<number>[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const k = i;
    const { blockNumber } = transactions[k];
    let entry = cache.get(blockNumber);
    if (entry) {
      entry.then((d) => (data[k] = d));
    } else {
      const promise = getBlockTimestamp(blockNumber, provider);
      promises.push(promise);
      cache.set(blockNumber, promise);
      promise.then((d) => (data[k] = d));
    }
  }

  await Promise.all(promises);

  return data;
}
