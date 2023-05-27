import { Contract } from 'ethers';
import { createProvider } from './network';
import uniswapV2Abi from './abi/uniswap-v2-factory.json';
import erc20Abi from './abi/erc20.json';
import { bold } from './console/font';
import { hyperLink } from './console/utils';
import { address, etherscanAddressLink } from './console/etherscan';

const UniswapFactoryV2Address = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const WETHAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function getSymbol(addr: string): Promise<string | null> {
  const provider = createProvider();
  const contract = new Contract(addr, erc20Abi, { provider });
  try {
    return String(await contract.symbol());
  } catch (e: any) {
    console.error(e.toString());
    return null;
  }
}

async function main() {
  let pairsFIFO: [token0: string, token1: string, pair: string][] = [];
  const provider = createProvider();
  const uniswap = new Contract(UniswapFactoryV2Address, uniswapV2Abi, {
    provider
  });
  const listener = (token0: string, token1: string, pair: string) => {
    pairsFIFO.push([token0, token1, pair]);
  };
  console.log('Listening pairs');
  uniswap.on('PairCreated', listener);

  const pairsChecker = async () => {
    if (pairsFIFO.length === 0) {
      const t = setTimeout(pairsChecker, 50);
      t.unref();
      return;
    }

    const [token0, token1, pairAddress] = pairsFIFO.shift()!;
    const [name0, name1] = await Promise.all([
      token0 === WETHAddress ? Promise.resolve('WETH') : getSymbol(token0),
      token1 === WETHAddress ? Promise.resolve('WETH') : getSymbol(token1)
    ]);

    console.log(
      `Pair created: ${bold(
        `${hyperLink(etherscanAddressLink(token0), name0!)}/${hyperLink(
          etherscanAddressLink(token1),
          name1!
        )}`
      )}. Pair address: ${address(pairAddress)}`
    );
    pairsChecker();
  };
  pairsChecker();

  process.on('SIGTERM', () => {
    uniswap.off('PairCreated', listener);
    return provider.destroy();
  });
}

main();
