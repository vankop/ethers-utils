import type { WebSocketProvider } from 'ethers';
import { Contract, formatEther, Log, EventLog } from 'ethers';
import { isContract } from './is-contract';

export interface Transaction {
  amount: string;
  from: string;
  to: string;
  hash: string;
  blockNumber: number;
}

function eventsToTransactions(
  events: Array<EventLog | Log>,
  contract: Contract
) {
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

  const contracts = new Set<string>();
  const promises = [];

  if (from || to) {
    for (const event of events) {
      const { from: f, to: t } = contract.interface.decodeEventLog(
        'Transfer',
        event.data,
        event.topics
      );
      promises.push(
        (async () => {
          const addr = from ? t : f;
          if (await isContract(addr, provider)) {
            contracts.add(addr);
          }
        })()
      );
    }

    await Promise.all(promises);

    const filtered = events.filter((e) => {
      const { from: f, to: t } = contract.interface.decodeEventLog(
        'Transfer',
        e.data,
        e.topics
      );
      const addr = from ? t : f;
      return !contracts.has(addr);
    });
    return eventsToTransactions(filtered, contract);
  } else {
    return eventsToTransactions(events, contract);
  }
}
