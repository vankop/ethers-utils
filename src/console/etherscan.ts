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
  return hyperLink(`https://etherscan.io/block/${num}`, `#${n}`);
}

export function address(addr: string, full = false) {
  return hyperLink(
    `https://etherscan.io/address/${addr}`,
    full ? addr : prettyAddress(addr)
  );
}

export function hyperLink(url: string, title: string) {
  return `\x1B]8;;${url}\x1B\\${title}\x1B]8;;\x1B\\`;
}
