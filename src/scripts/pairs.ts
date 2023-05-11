import {
  addPair,
  addSpan,
  removePair,
  viewAllPairs,
  viewAllSpans
} from '../pairs';
import { keyValueOptionsToObject } from '../cli';

const [, , , action, name, ...options] = process.argv;

function add() {
  if (!name) throw new Error('Pair name should be provided');
  const keys = keyValueOptionsToObject(options);
  addPair(name, keys);
  console.log('Added ⇩ ⇩ ⇩');
  console.log(`\x1b[32m${name}\x1b[0m`);
  return Promise.resolve();
}

function remove() {
  if (!name) throw new Error('Pair name should be provided');
  removePair(name);
  console.log('Removed ⇩ ⇩ ⇩');
  console.log(`\x1b[32m${name}\x1b[0m`);
  return Promise.resolve();
}

function list() {
  console.log(viewAllPairs());
  return Promise.resolve();
}

async function timespan() {
  if (name === 'list') {
    console.log(viewAllSpans());
    return;
  }
  if (!name)
    throw new Error('You should provide span name!. Like "pump_butter"');
  const { pair, start, end } = keyValueOptionsToObject(options);
  if (!pair)
    throw new Error(
      'You should provide pair name, that you have added! Like "pair=BUTTER/WETH"'
    );
  if (!start || !end)
    throw new Error(
      'You should provide start/end timestamps! Like "start=1683504052 end=1683590452"'
    );
  await addSpan(name, pair, start, end);
  console.log(`Span ${JSON.stringify(name)} was added!`);
}

export function exec(): Promise<any> {
  switch (action) {
    case 'add':
      return add();
    case 'remove':
      return remove();
    case 'list':
      return list();
    case 'timespan':
      return timespan();
    default:
      throw new Error(
        `${JSON.stringify(action)} action is not exists in pairs script!`
      );
  }
}
