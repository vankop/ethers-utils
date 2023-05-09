import {createProvider} from "./provider";
import {findBlockByTimestamp} from "./find-block-by-timestamp";

async function main() {
  const provider = createProvider();
  const block = await findBlockByTimestamp(1682755252, provider);
  await provider.destroy();
}

main();
