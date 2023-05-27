import { Contract } from 'ethers';
import type { Provider } from 'ethers';
import erc20Abi from '../abi/erc20.json';

export async function getSymbol(
  addr: string,
  provider: Provider
): Promise<string | null> {
  const contract = new Contract(addr, erc20Abi, { provider });
  try {
    return String(await contract.symbol());
  } catch (e: any) {
    console.error(e.toString());
    return null;
  }
}
