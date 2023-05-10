function splitThousands(str: string) {
  const strs = [];
  const partial = str.length % 3;
  for (let i = partial; i < str.length; i += 3) strs.push(str.slice(i, i + 3));
  return strs.length === 0
    ? str
    : partial !== 0
    ? `${partial},${strs.join(',')}`
    : strs.join(',');
}

export function amount(count: string) {
  const [leading, fraction = ''] = count.split('.');
  return `${splitThousands(leading)}.${fraction.slice(0, 4)}`;
}
