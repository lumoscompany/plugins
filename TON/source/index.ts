import chainplugin, { Chainplugin as IChainplugin } from '@lumoscompany/chainplugin';

import {
  EventsProvider,
  AssetsProvider,
  MessagesProvider,
  BrowserProvider,
  AddressProvider,
} from './providers';

class TON implements IChainplugin {
  private _assets = new AssetsProvider();
  private _events = new EventsProvider();
  private _messages = new MessagesProvider();
  private _browser = new BrowserProvider();
  private _address = new AddressProvider();

  constructor() {}

  async address() {
    return this._address;
  }

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

export default chainplugin(TON);
