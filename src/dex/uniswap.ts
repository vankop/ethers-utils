import UniswapV3FactoryJson from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import type { WebSocketProvider } from 'ethers';
import { Contract } from 'ethers';

const UniswapV3FactoryContractAddress =
  '0x1F98431c8aD98523631AE4a59f267346ea31F984';

export function uniswapTokenPoolAddress(
  token0: string,
  token1: string,
  provider: WebSocketProvider
) {
  const factoryAddressContract = new Contract(
    UniswapV3FactoryContractAddress,
    UniswapV3FactoryJson.abi,
    provider
  );

  return factoryAddressContract.getPool(token0, token1, 500);
}
