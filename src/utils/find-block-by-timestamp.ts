import type { WebSocketProvider, Block } from 'ethers';

async function getBlockTimeStamp(
  provider: WebSocketProvider,
  blockNumber?: number
) {
  const block = await provider.getBlock(blockNumber || 'latest', false);
  if (!block)
    throw new Error(
      blockNumber
        ? `Block number ${blockNumber} not found`
        : 'Latest block not found!'
    );
  return block;
}

async function _findBlockByTimestamp(
  provider: WebSocketProvider,
  timestamp: number,
  blockStart: number,
  blockEnd?: number
): Promise<Block> {
  const [block0, block1] = await Promise.all([
    getBlockTimeStamp(provider, blockStart),
    getBlockTimeStamp(provider, blockEnd)
  ]);
  const t0 = block0.timestamp;
  const t1 = block1.timestamp;
  const i0 = blockStart;
  const i1 = block1.number;
  const averageBlockTime = (t1 - t0) / (i1 - i0);
  const k = (timestamp - t0) / (t1 - t0);
  const expectedMiddleBlockNumber = Math.floor(i0 + k * (i1 - i0));
  const expectedBlock = await getBlockTimeStamp(
    provider,
    expectedMiddleBlockNumber
  );
  const discrepancyInBlocks = Math.floor(
    (timestamp - expectedBlock.timestamp) / averageBlockTime
  );
  const newExpectedMiddle = expectedBlock.number + discrepancyInBlocks;

  // console.log('---------------------------------------');
  // console.log(
  //   `target timestamp (${timestamp}) lies ${k} of the way from block #${blockStart} (t=${t0}) to block #${
  //     blockEnd || 'latest'
  //   } (t=${t1})`
  // );
  // console.log(
  //   `Expected block# assuming linearity: ${expectedBlock.number} (t=${expectedBlock.timestamp})`
  // );
  // console.log(
  //   'Expected nblocks required to reach target (again assuming linearity):',
  //   discrepancyInBlocks
  // );
  // console.log('New guess at block #:', newExpectedMiddle);

  const r = Math.abs(discrepancyInBlocks);
  if (r === 0) return expectedBlock;

  return _findBlockByTimestamp(
    provider,
    timestamp,
    newExpectedMiddle - r,
    newExpectedMiddle + r
  );
}

export async function findBlockByTimestamp(
  timestamp: number,
  provider: WebSocketProvider
) {
  return _findBlockByTimestamp(provider, timestamp, 1);
}
