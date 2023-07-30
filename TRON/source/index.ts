import chainplugin, { Chainplugin as IChainplugin } from '@lumoscompany/chainplugin';
import { EventsProvider, AssetsProvider, MessagesProvider, BrowserProvider } from './providers';

class TRON implements IChainplugin {
  private _assets = new AssetsProvider();
  private _events = new EventsProvider();
  private _messages = new MessagesProvider();
  private _browser = new BrowserProvider();

  constructor() {}

  async browser() {
    return this._browser;
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
