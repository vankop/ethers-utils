import json from "../config.json";
import { InfuraProvider } from "ethers";
import type {WebSocketProvider} from "ethers";

export function createProvider(): WebSocketProvider {
  return InfuraProvider.getWebSocketProvider(undefined, 'ec904bd574ed4ec78e21cf7c92563322');
}
