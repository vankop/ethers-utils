import { block } from '../console/etherscan';
import { spinner } from '../utils';
import { allTransactionsInRange } from './all-transactions-in-range';
import { createProvider } from '../network';
import { getSpanDataForTransaction } from '../pairs';

const ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 amount)'
];

export async function transactions(
  spanName: string,
  type: 'buy' | 'sell' | 'all'
) {
  const {
    pairName,
    pairAddress,
    contractAddress,
    blockSpan: [start, end]
  } = getSpanDataForTransaction(spanName);
  const provider = createProvider();
  console.log(`Span from ${block(start)} to ${block(end)}`);

  const endLoading = spinner(
    () => `Loading ${pairName} ${type} transactions for span.`
  );
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
    endLoading();
    return events;
  } catch (e) {
    endLoading();
    throw e;
  }
}
