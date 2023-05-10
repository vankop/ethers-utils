import type { WebSocketProvider } from 'ethers';
import { Contract, formatEther } from 'ethers';

interface Transaction {
  amount: string;
  from: string;
  to: string;
  hash: string;
}

export async function allTransactionsInRange(
  blockStart: number,
  blockEnd: number,
  contractAddress: string,
  abi: string[],
  provider: WebSocketProvider
) {
  const contract = new Contract(contractAddress, abi, { provider });
  const filter = contract.filters.Transfer();
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
      hash: event.transactionHash
    });
  }

  return transactions;
}
