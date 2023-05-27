import { hyperLink } from './utils';

function prettyAddress(addr: string) {
  return `${addr.slice(0, 5)}...${addr.slice(-3)}`;
}

export function txhash(hash: string, full = false) {
  return hyperLink(
    `https://etherscan.io/tx/${hash}`,
    full ? hash : prettyAddress(hash)
  );
}

export function block(num: number) {
  const n = num.toString();
  return hyperLink(etherscanBlockLink(num), `#${n}`);
}

export function address(addr: string, full = false) {
  return hyperLink(
    etherscanAddressLink(addr),
    full ? addr : prettyAddress(addr)
  );
}

export function etherscanAddressLink(addr: string) {
  return `https://etherscan.io/address/${addr}`;
}

export function etherscanBlockLink(blockNumber: number) {
  return `https://etherscan.io/block/${blockNumber}`;
}
