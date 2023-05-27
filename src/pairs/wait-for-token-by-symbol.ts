import { listenNewPairs } from './listen-new-pairs';
import { getSymbol } from '../tokens/get-symbol';
import { createProvider } from '../network';

const WETHAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

function isSymbolSame(symbol0: string, symbol1: string) {
  const s0 = symbol0.trim();
  const s1 = symbol1.trim();
  if (s0[0] === '$' && s1[0] !== '$') return s0.slice(1) === s1;
  if (s0[0] !== '$' && s1[0] === '$') return s0 === s1.slice(1);
  return s0 === s1;
}

export async function waitForTokenBySymbol(symbol: string): Promise<string> {
  const provider = createProvider();
  return new Promise<string>((res) => {
    const stop = listenNewPairs(
      async ([token0, token1]: [string, string, string]) => {
        const [name0, name1] = await Promise.all([
          token0 === WETHAddress
            ? Promise.resolve('WETH')
            : getSymbol(token0, provider),
          token1 === WETHAddress
            ? Promise.resolve('WETH')
            : getSymbol(token1, provider)
        ]);

        console.log(name0, name1);
        if (name0 && isSymbolSame(name0, symbol)) resolve(token0);
        else if (name1 && isSymbolSame(name1, symbol)) resolve(token1);
      }
    );
    const resolve = (token: string) => {
      stop();
      res(token);
    };
  });
}
