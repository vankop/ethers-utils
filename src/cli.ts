export function keyValueOptionsToObject(strs: string[]) {
  const obj: Record<string, string> = {};
  try {
    for (const str of strs) {
      const r = /([^=]+)=([^=]+)/.exec(str);
      if (!r) throw new Error('Parsing params error!');
      const [, key, value] = r;
      obj[key.trim()] = value.trim();
    }
  } catch (e) {
    throw new Error('Parsing params error!');
  }
  return obj;
}
