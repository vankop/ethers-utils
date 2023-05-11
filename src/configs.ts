import fs from 'fs';
import path from 'path';

let configDir: string;

function findDirectory() {
  if (configDir) return configDir;
  let dir = __dirname;
  const i = __dirname.lastIndexOf('node_modules');
  if (i > 0) {
    dir = dir.slice(0, i);
  }
  configDir = path.resolve(dir, 'node_modules', '.cache', 'ether-utils');
  return configDir;
}

const readCache = new Map<string, any>();

function readConfig(dir: string, configName: string) {
  if (readCache.has(configName)) return readCache.get(configName);
  let c = fs.readFileSync(path.resolve(dir, configName), { encoding: 'utf-8' });
  c = JSON.parse(c);
  readCache.set(configName, c);
  return c;
}

function writeConfig(dir: string, configName: string, data: any) {
  readCache.set(configName, data);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
  return fs.writeFileSync(
    path.resolve(dir, configName),
    JSON.stringify(data, null, 4)
  );
}

export function withConfig(
  configName: string,
  fn: (config: Record<string, any>) => any,
  readonly = false
) {
  const pth = findDirectory();
  let config = {};
  try {
    config = readConfig(pth, configName);
  } catch {}
  let r = fn(config);
  if (!readonly) {
    if (r instanceof Promise) {
      r = r.then(() => writeConfig(pth, configName, config));
    } else {
      writeConfig(pth, configName, config);
    }
  }
  return r;
}
