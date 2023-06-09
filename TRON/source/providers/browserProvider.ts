import {
  Environment,
  BrowserProvider as IBrowserProvider,
  BrowserURLRequest,
  BrowserURLResponse,
} from '@lumoscompany/chainplugin';
import { trongrid } from '../services';

class BrowserProvider implements IBrowserProvider {
  environment: Environment;

  constructor(environment: Environment) {
    this.environment = environment;
  }

  async url(args: BrowserURLRequest): Promise<BrowserURLResponse> {
    let endpoint: string;
    if (this.environment.testnet) {
      endpoint = `https://shastapi.tronscan.org/#`;
    } else {
      endpoint = `https://tronscan.org/#`;
    }

    if ('event' in args) {
      return { url: `${endpoint}/transaction/${args.event.hash}` };
    } else if ('asset' in args) {
      const address = args.asset.address;
      if (trongrid.isTRONAddress(address)) {
        return { url: `${endpoint}/token20/${address}` };
      } else {
        const _address = address === '_' ? '0' : address;
        return { url: `${endpoint}/token/${_address}` };
      }
    } else {
      return {};
    }
  }
}

export { BrowserProvider };
