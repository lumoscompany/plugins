import chainplugin, {
  Chainplugin as IChainplugin,
  QuickResponseProvider,
} from '@lumoscompany/chainplugin';

import {
  EventsProvider,
  AssetsProvider,
  MessagesProvider,
  BrowserProvider,
  AddressProvider,
  QRProvider,
} from './providers';

class TON implements IChainplugin {
  private _assets = new AssetsProvider();
  private _events = new EventsProvider();
  private _messages = new MessagesProvider();
  private _browser = new BrowserProvider();
  private _address = new AddressProvider();
  private _qr = new QRProvider();

  constructor() {}

  async qr(): Promise<QuickResponseProvider> {
    return this._qr;
  }

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
