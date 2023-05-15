export function keyValueOptionsToObject(
  strs: string[]
): Record<string, string | boolean> {
  const obj: Record<string, string | boolean> = {};
  try {
    for (const str of strs) {
      const r = /([^=]+)=([^=]+)/.exec(str);
      if (!r) {
        if (str.indexOf('=') === -1) {
          obj[str] = true;
          continue;
        } else throw new Error('Parsing params error!');
      }
      const [, key, value] = r;
      obj[key.trim()] = value.trim();
    }
  } catch (e) {
    throw new Error('Parsing params error!');
  }
  return obj;
}
