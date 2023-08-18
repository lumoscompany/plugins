import {
  BrowserProvider as IBrowserProvider,
  BrowserURLRequest,
  BrowserURLResponse,
} from '@lumoscompany/chainplugin';

class BrowserProvider implements IBrowserProvider {
  constructor() {}

  async url(args: BrowserURLRequest): Promise<BrowserURLResponse> {
    let endpoint: string;
    if (globalEnvironment.isTestnetEnabled) {
      endpoint = `https://goerli.etherscan.io`;
    } else {
      endpoint = `https://etherscan.io`;
    }

    if ('event' in args) {
      return { url: `${endpoint}/tx/${args.event.hash}` };
    } else if ('asset' in args) {
      if (args.asset.address === '_') {
        return { url: `${endpoint}` };
      } else {
        return { url: `${endpoint}/token/${args.asset.address}` };
      }
    } else {
      return {};
    }
  }
}

export { BrowserProvider };
