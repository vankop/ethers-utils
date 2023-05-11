import type { WebSocketProvider } from 'ethers';
import { Contract, formatEther } from 'ethers';

export interface Transaction {
  amount: string;
  from: string;
  to: string;
  hash: string;
  blockNumber: number;
}

export async function allTransactionsInRange(
  blockStart: number,
  blockEnd: number,
  contractAddress: string,
  abi: string[],
  provider: WebSocketProvider,
  transferFilter?: { from: string } | { to: string }
) {
  const from =
    transferFilter && 'from' in transferFilter ? transferFilter.from : null;
  const to =
    transferFilter && 'to' in transferFilter ? transferFilter.to : null;
  const contract = new Contract(contractAddress, abi, { provider });
  const filter = contract.filters.Transfer(from, to);
  const events = await contract.queryFilter(filter, blockStart, blockEnd);
  const transactions: Transaction[] = [];

  for (const event of events) {
    const { from, to, amount } = contract.interface.decodeEventLog(
      'Transfer',
      event.data,
      event.topics
    );
    transactions.push({
      from,
      to,
      amount: formatEther(amount),
      hash: event.transactionHash,
      blockNumber: event.blockNumber
    });
  }

  return transactions;
}
