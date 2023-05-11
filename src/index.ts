import { destroy } from './network';

const [, , scriptName] = process.argv;

switch (scriptName) {
  case 'network': {
    require('./scripts/network').exec();
    break;
  }
  case 'address': {
    require('./scripts/address').exec();
    break;
  }
  case 'pairs': {
    require('./scripts/pairs').exec().then(destroy);
    break;
  }
  case 'transactions': {
    require('./scripts/transactions').exec().then(destroy);
    break;
  }
  default:
    throw new Error(`${JSON.stringify(scriptName)} is unknown script!`);
}
