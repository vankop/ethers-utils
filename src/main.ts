import { createProvider } from './network';
import { isContract } from './transactions/is-contract';

async function main() {
  const provider = createProvider();
  console.log(
    await isContract('0x007933790a4f00000099e9001629d9fE7775B800', provider)
  );
  await provider.destroy();
}

main();
