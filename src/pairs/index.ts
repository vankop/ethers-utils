import { withConfig } from '../configs';
import { resolveAddress } from '../address';
import { Table } from 'console-table-printer';
import { address, block } from '../console/etherscan';
import { findBlockByTimestamp } from '../utils/find-block-by-timestamp';
import { createProvider } from '../network';
import { differenceInDays, compareAsc } from 'date-fns';
import { formatTime } from '../utils';

const PAIRS_FILENAME = 'pairs.json';

function getPairs(
  config: Record<string, any>
): Record<string, { pair: string; token: string }> {
  return config['pairs'] || (config['pairs'] = {});
}

function getTimeSpans(
  config: Record<string, any>
): Record<string, { pair: string; start: number; end: number }> {
  return config['spans'] || (config['spans'] = {});
}

export function addPair(name: string, pair: string, token: string) {
  withConfig(PAIRS_FILENAME, (config) => {
    const pairs = getPairs(config);
    pairs[name] = { pair: resolveAddress(pair), token: resolveAddress(token) };
  });
}

export function addSpan(name: string, pair: string, t0: string, t1: string) {
  const provider = createProvider();
  return withConfig(PAIRS_FILENAME, async (config) => {
    const spans = getTimeSpans(config);
    const pairs = getPairs(config);
    if (!pairs[pair]) throw new Error(`No ${JSON.stringify(pair)} was found!`);

    const i0 = parseInt(t0, 10);
    if (Number.isNaN(i0))
      throw new Error(
        `1st timestamp ${JSON.stringify(
          t0
        )} is not valid unix timestamp in seconds`
      );
    const d0 = new Date(i0 * 1000);
    const i1 = parseInt(t1, 10);
    if (Number.isNaN(i1))
      throw new Error(
        `2nd timestamp ${JSON.stringify(
          t1
        )} is not valid unix timestamp in seconds`
      );
    const d1 = new Date(i1 * 1000);

    console.log(
      `Span from \x1b[36m${formatTime(d0)}\x1b[0m to \x1b[36m${formatTime(
        d1
      )}\x1b[0m`
    );

    if (compareAsc(d1, d0) !== 1)
      throw new Error('1st timestamp should be lower 2nd');
    const diff = differenceInDays(d1, d0);
    if (diff > 30)
      throw new Error('Too large span. 30 calendar days as maximum');

    const [blockStart, blockEnd] = await Promise.all([
      findBlockByTimestamp(i0, provider),
      findBlockByTimestamp(i1, provider)
    ]);
    console.log(
      `Span is from block ${block(blockStart.number)} to ${block(
        blockEnd.number
      )}`
    );
    spans[name] = { pair, start: blockStart.number, end: blockEnd.number };
  });
}

export function removePair(name: string) {
  withConfig(PAIRS_FILENAME, (config) => {
    const pairs = getPairs(config);
    delete pairs[name];
    const spans = getTimeSpans(config);
    for (const spanName of Object.keys(spans)) {
      const { pair } = spans[spanName];
      if (pair === name) delete spans[spanName];
    }
  });
}

export function viewAllPairs() {
  return withConfig(
    PAIRS_FILENAME,
    (config) => {
      const pairs = getPairs(config);
      const tableView = new Table({ charLength: { ['\x1B']: 3 } });
      tableView.addColumn('name').addColumn('pair').addColumn('token');
      for (const [name, { pair, token }] of Object.entries(pairs)) {
        tableView.addRow({
          name,
          pair: address(pair),
          token: address(token)
        });
      }
      return tableView.render();
    },
    true
  );
}

export function viewAllSpans() {
  return withConfig(
    PAIRS_FILENAME,
    (config) => {
      const spans = getTimeSpans(config);
      const tableView = new Table({ charLength: { ['\x1B']: 3 } });
      tableView
        .addColumn('name')
        .addColumn('pair')
        .addColumn('start block')
        .addColumn('end block');
      for (const [name, { pair, start, end }] of Object.entries(spans)) {
        tableView.addRow({
          name,
          pair,
          ['start block']: block(start),
          ['end block']: block(end)
        });
      }
      return tableView.render();
    },
    true
  );
}

interface TransactionInfo {
  pairName: string;
  pairAddress: string;
  contractAddress: string;
  blockSpan: [number, number];
}

export function getSpanDataForTransaction(spanName: string): TransactionInfo {
  return withConfig(PAIRS_FILENAME, (config) => {
    const pairs = getPairs(config);
    const spans = getTimeSpans(config);
    const span = spans[spanName];
    if (!span) throw new Error(`Span ${JSON.stringify(spanName)} not found!`);
    const pair = pairs[span.pair];
    if (!pair) throw new Error(`Pair ${JSON.stringify(span.pair)} not found!`);
    return {
      pairName: span.pair,
      pairAddress: pair.pair,
      contractAddress: pair.token,
      blockSpan: [span.start, span.end]
    };
  });
}
