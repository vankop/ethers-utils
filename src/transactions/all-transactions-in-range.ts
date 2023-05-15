import type { WebSocketProvider } from 'ethers';
import { Contract, EventLog, formatUnits, Log } from 'ethers';
import ABI from '../abi/erc20.json';
import { isBuyLike, isSellLike, isStrict, TransactionType } from './type';

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
  pairAddress: string,
  provider: WebSocketProvider,
  type: TransactionType
) {
  const from = isBuyLike(type) ? pairAddress : null;
  const to = isSellLike(type) ? pairAddress : null;
  const contract = new Contract(contractAddress, ABI, { provider });
  let decimals = 18;
  try {
    decimals = await contract.decimals();
  } catch (e: any) {
    console.log(e.toString());
  }
  const filter = contract.filters.Transfer(from, to);
  let events = await contract.queryFilter(filter, blockStart, blockEnd);

  if (isStrict(type)) {
    const from = isBuyLike(type) ? null : pairAddress;
    const to = isSellLike(type) ? null : pairAddress;
    const filter = contract.filters.Transfer(from, to);
    let viceVersaEvents = await contract.queryFilter(
      filter,
      blockStart,
      blockEnd
    );
    const addresses = new Set<string>();
    for (const event of viceVersaEvents) {
      const { from, to } = contract.interface.decodeEventLog(
        'Transfer',
        event.data,
        event.topics
      );
      const addr = isBuyLike(type) ? from : to;
      addresses.add(addr);
    }

    events = events.filter((event) => {
      const { from, to } = contract.interface.decodeEventLog(
        'Transfer',
        event.data,
        event.topics
      );
      const addr = isBuyLike(type) ? to : from;
      return !addresses.has(addr);
    });
  }

  return eventsToTransactions(events, contract, decimals);
}
