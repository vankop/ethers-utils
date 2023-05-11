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
  default:
    throw new Error(`${JSON.stringify(scriptName)} is unknown script!`);
}
