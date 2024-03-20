import {
  PluginError,
  QuickResponseAction,
  QuickResponseGenerateRequest,
  QuickResponseGenerateResponse,
  QuickResponseProvider,
  QuickResponseResolveRequest,
  QuickResponseResolveResponse,
} from '@lumoscompany/chainplugin';

require('core-js/features/url');
require('core-js/features/url-search-params');

import { Address } from 'ton';

class QRProvider implements QuickResponseProvider {
  constructor() {}

  async resolve(args: QuickResponseResolveRequest): Promise<QuickResponseResolveResponse> {
    const result: QuickResponseResolveResponse = { action: undefined };

    let url: URL;
    try {
      url = new URL(args.value);
    } catch {}

    if (!url) {
      return result;
    }

    if (url.protocol !== 'ton:') {
      return result;
    }

    let address: Address;
    let bounceable: boolean = true;

    try {
      const _address = url.pathname.slice(1);
      if (Address.isRaw(_address)) {
        address = Address.parseRaw(_address);
        bounceable = false;
      } else if (Address.isFriendly(_address)) {
        const parsed = Address.parseFriendly(_address);
        address = parsed.address;
        bounceable = parsed.isBounceable;
      } else {
        throw new PluginError(0, 'Invalid address');
      }
    } catch {
      return result;
    }

    let asset: string | undefined = undefined;
    let amount: string | undefined = undefined;

    let unsupported = false; // exclude potentially bad configurations, e.g. custom initData, body or etc.

    url.searchParams.forEach((value, key) => {
      switch (key.toLowerCase()) {
        case 'bin':
        case 'text':
        case 'init':
          unsupported = true;
        case 'jetton':
          try {
            asset = Address.parse(value).toRawString();
          } catch {
            unsupported = true;
          }
          break;
        case 'amount':
          amount = value;
          break;
        default:
          break;
      }
    });

    if (unsupported) {
      return result;
    }

    result.action = {
      transfer: {
        recipient: address.toString({ urlSafe: true, bounceable }),
        asset: asset,
        amount: amount,
      },
    };

    return result;
  }

  async generate(args: QuickResponseGenerateRequest): Promise<QuickResponseGenerateResponse> {
    if ('transfer' in args.purpose) {
      const transfer = args.purpose.transfer;
      let value = `ton://transfer/${Address.parse(transfer.recipient).toString({
        urlSafe: true,
        bounceable: false,
      })}`;
      if (transfer.asset && transfer.asset.address !== '_') {
        value = `${value}?jetton=${Address.parse(transfer.asset.address).toString({
          urlSafe: true,
        })}`;
      }
      return { value: value };
    }
    return { value: undefined };
  }
}

export { QRProvider };
