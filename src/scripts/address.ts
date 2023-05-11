import { addAlias, removeAlias, viewAllAddresses } from '../address';

const [, , , action, arg0, arg1] = process.argv;

function alias() {
  if (arg0 === arg1 && arg0 === undefined) {
    console.log(viewAllAddresses());
    return;
  }
  if (arg0 === 'remove') {
    if (typeof arg1 !== 'string')
      throw new Error('You should provide alias name!');
    removeAlias(arg1);
    console.log(`Alias ${JSON.stringify(arg1)} removed!`);
    return;
  }

  if (typeof arg0 !== 'string')
    throw new Error('You should provide alias name!');
  if (typeof arg1 !== 'string')
    throw new Error('You should provide alias address!');
  addAlias(arg0, arg1);
  console.log(`Alias ${JSON.stringify(arg0)} added!`);
}

export function exec() {
  switch (action) {
    case 'alias':
      return alias();
    default:
      throw new Error(
        `${JSON.stringify(action)} action is not exists in provider script!`
      );
  }
}
