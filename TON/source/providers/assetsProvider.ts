import {
  AssetsProvider as IAssetsProvider,
  FetchAssetsRequest,
  ComplementaryField,
  Asset,
} from '@lumoscompany/chainplugin';

import BigNumber from 'bignumber.js';
import { ton, bn } from '../services';

class AssetsProvider implements IAssetsProvider {
  constructor() {}

  calculateTotalPrice(quantity: string, decimals: number, price: number | undefined): number {
    if (price === undefined) {
      return 0;
    }

    const bnq = new BigNumber(bn(quantity, decimals));
    const result = new BigNumber(price).multipliedBy(bnq).toNumber();

    if (!result || result == 0) {
      return 0;
    }

    return Math.ceil(result * 1000) / 1000;
  }

  async fetchNativeAsset(args: FetchAssetsRequest, price?: number): Promise<Asset> {
    const result = await ton.getAccount({ address: args.address });
    const fields: ComplementaryField[] = [];

    const token_price_in_usd = price || 0;
    if (token_price_in_usd > 0) {
      fields.push({
        name: 'Price',
        text: {
          value: `${token_price_in_usd}`,
          currency: {
            abbreviation: 'USD',
          },
        },
      });
    }

    return {
      name: 'TON',
      icon: ton.TONAssetImage,
      quantity: bn(`${result.balance}`, 9),
      decimals: 9,
      address: '_',
      type: 'fungible',
      malicious: false,
      pricing: {
        total: this.calculateTotalPrice(`${result.balance}`, 9, token_price_in_usd),
        one: token_price_in_usd,
      },
      preview: {
        significant: {},
        complementary: fields,
      },
    };
  }

  async fetch(args: FetchAssetsRequest): Promise<Asset[]> {
    let jettons: ton.GetJettonsResponse;
    try {
      jettons = await ton.getJettons({ address: args.address });
    } catch {
      jettons = {
        balances: [],
      };
    }

    const rates = await ton.getRates({
      tokens: ['TON'].concat(
        jettons.balances.map(balance => ton.addressFromRaw(balance.jetton.address, false))
      ),
      currencies: ['USD'],
    });

    const native = await this.fetchNativeAsset(args, rates.rates['TON'].prices['USD']);
    const tokens = jettons.balances.map(balance => {
      const jetton = balance.jetton;
      const friendlyAddress = ton.addressFromRaw(jetton.address, false);

      const price = rates.rates[friendlyAddress].prices['USD'];
      const token_price_in_usd = price || 0;

      const fields: ComplementaryField[] = [];

      fields.push({
        name: 'Name',
        text: {
          value: jetton.name,
        },
      });

      if (token_price_in_usd > 0) {
        fields.push({
          name: 'Price',
          text: {
            value: `${token_price_in_usd}`,
            currency: {
              abbreviation: 'USD',
            },
          },
        });
      }

      fields.push({
        name: 'Contract Address',
        text: {
          value: friendlyAddress,
          copyable: true,
        },
      });

      return {
        name: jetton.symbol,
        icon: {
          url: {
            string: jetton.image,
          },
        },
        quantity: bn(`${balance.balance}`, jetton.decimals),
        decimals: jetton.decimals,
        address: jetton.address,
        type: 'fungible',
        malicious: jetton.verification == 'blacklist',
        pricing: {
          total: this.calculateTotalPrice(
            `${balance.balance}`,
            jetton.decimals,
            token_price_in_usd
          ),
          one: token_price_in_usd,
        },
        preview: {
          significant: {},
          complementary: fields,
        },
      };
    });

    return [native].concat(tokens);
  }
}

export { AssetsProvider };
