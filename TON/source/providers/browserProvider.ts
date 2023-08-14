import {
  BrowserProvider as IBrowserProvider,
  BrowserURLRequest,
  BrowserURLResponse,
} from '@lumoscompany/chainplugin';

import { ton } from '../services';

class BrowserProvider implements IBrowserProvider {
  constructor() {}

  async url(args: BrowserURLRequest): Promise<BrowserURLResponse> {
    let endpoint: string;
    if (globalEnvironment.isTestnetEnabled) {
      endpoint = `https://testnet.tonviewer.com`;
    } else {
      endpoint = `https://tonviewer.com`;
    }

    if ('event' in args) {
      return { url: `${endpoint}/transaction/${args.event.hash}` };
    } else if ('asset' in args) {
      if (args.asset.address === '_') {
        return { url: `${endpoint}` };
      } else {
        return { url: `${endpoint}/${ton.addressFromRaw(args.asset.address)}` };
      }
    } else {
      return {};
    }
  }
}

export { BrowserProvider };
