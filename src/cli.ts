export function keyValueOptionsToObject(
  strs: string[]
): Record<string, string | boolean | string[]> {
  const obj: Record<string, string | boolean | string[]> = {};
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
      const k = key.trim();
      const v = value.trim();
      const currentValue = obj[k];
      if (typeof currentValue === 'string') {
        obj[k] = [currentValue, v];
      } else if (Array.isArray(currentValue)) {
        currentValue.push(v);
      } else {
        obj[k] = v;
      }
    }
  } catch (e) {
    throw new Error('Parsing params error!');
  }
  return obj;
}
