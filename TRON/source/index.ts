import chainplugin, { Chainplugin as IChainplugin, Environment } from '@lumoscompany/chainplugin';
import { EventsProvider, AssetsProvider, MessagesProvider } from './providers';

class TRON implements IChainplugin {
  environment: Environment;

  private _assets: AssetsProvider;
  private _events: EventsProvider;
  private _messages: MessagesProvider;

  constructor(environment: Environment) {
    globalThis.testnet = environment.testnet;

    this.environment = environment;

    this._assets = new AssetsProvider(environment);
    this._events = new EventsProvider(environment);
    this._messages = new MessagesProvider(environment);
  }

  async assets() {
    return this._assets;
  }

  async events() {
    return this._events;
  }

  async messages() {
    return this._messages;
  }
}

export default chainplugin(TRON);
