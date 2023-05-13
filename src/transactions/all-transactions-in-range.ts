import type { WebSocketProvider } from 'ethers';
import { Contract, formatUnits, Log, EventLog } from 'ethers';
import ABI from '../abi/erc20.json';

export interface Transaction {
  amount: string;
  from: string;
  to: string;
  hash: string;
  blockNumber: number;
}

function eventsToTransactions(
  events: Array<EventLog | Log>,
  contract: Contract,
  decimals: number
) {
  const transactions: Transaction[] = [];
  for (const event of events) {
    const {
      from,
      to,
      value: amount
    } = contract.interface.decodeEventLog('Transfer', event.data, event.topics);
    transactions.push({
      from,
      to,
      amount: formatUnits(amount, decimals),
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
  provider: WebSocketProvider,
  transferFilter?: { from: string } | { to: string }
) {
  const from =
    transferFilter && 'from' in transferFilter ? transferFilter.from : null;
  const to =
    transferFilter && 'to' in transferFilter ? transferFilter.to : null;
  const contract = new Contract(contractAddress, ABI, { provider });
  let decimals = 18;
  try {
    decimals = await contract.decimals();
  } catch (e: any) {
    console.log(e.toString());
  }
  const filter = contract.filters.Transfer(from, to);
  const events = await contract.queryFilter(filter, blockStart, blockEnd);

  return eventsToTransactions(events, contract, decimals);
}
