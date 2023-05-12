import type { WebSocketProvider } from 'ethers';

export async function isContract(addr: string, provider: WebSocketProvider) {
  try {
    const code = await provider.getCode(addr);
    if (code !== '0x') return true;
  } catch {}
  return false;
}
