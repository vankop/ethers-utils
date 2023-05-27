import { Contract } from 'ethers';
import { createProvider } from '../network';
import uniswapV2Abi from '../abi/uniswap-v2-factory.json';

type Pair = [token0: string, token1: string, pair: string];

const UniswapFactoryV2Address = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

export function listenNewPairs(callback: (pair: Pair) => void): () => void {
  const provider = createProvider();
  const contract = new Contract(UniswapFactoryV2Address, uniswapV2Abi, {
    provider
  });
  const listener = (token0: string, token1: string, pair: string) => {
    callback([token0, token1, pair]);
  };
  contract.on('PairCreated', listener);
  return () => contract.off('PairCreated', listener);
}
