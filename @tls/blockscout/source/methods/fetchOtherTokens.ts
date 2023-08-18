import { Asset, Image, ComplementaryField } from '@lumoscompany/chainplugin';

import { API } from '../api';
import { bn, calculateTotalPrice } from '../utilites';

export const fetchOtherTokens = async (args: { api: API; address: string }): Promise<Asset[]> => {
  const balances = await args.api.getTokenBalances({ address: args.address });
  const assets = balances.map(balance => {
    const token = balance.token;
    if (token.type !== 'ERC-20') {
      return undefined;
    }

    const decimals = parseInt(token.decimals) || args.api.network.token.decimals;

    const token_price_in_usd = parseFloat(token.exchange_rate) || 0;
    const fields: ComplementaryField[] = [];

    fields.push({
      name: 'Name',
      text: {
        value: token.name,
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
        value: token.address,
        copyable: true,
      },
    });

    let icon: Image | undefined = undefined;
    if (token.icon_url) {
      icon = { url: { string: token.icon_url } };
    }

    return {
      name: token.symbol,
      icon: icon,
      quantity: bn(balance.value, decimals),
      decimals: decimals,
      address: token.address,
      type: 'fungible',
      malicious: false,
      pricing: {
        total: calculateTotalPrice({
          quantity: balance.value,
          decimals,
          price: token_price_in_usd,
        }),
        one: token_price_in_usd,
      },
      preview: {
        significant: {},
        complementary: fields,
      },
    };
  });

  return assets.filter(a => a !== undefined);
};
