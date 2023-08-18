import { Asset, ComplementaryField } from '@lumoscompany/chainplugin';

import { API } from '../api';
import { bn, calculateTotalPrice } from '../utilites';

export const fetchNativeToken = async (args: { api: API; address: string }): Promise<Asset> => {
  const address = await args.api.getAddress({ address: args.address });

  const fields: ComplementaryField[] = [];
  const quantity = address.coin_balance ?? '';

  let token_price_in_usd = 0;
  if (address.exchange_rate) {
    token_price_in_usd = parseFloat(address.exchange_rate);
    fields.push({
      name: 'Price',
      text: {
        value: address.exchange_rate,
        currency: {
          abbreviation: 'USD',
        },
      },
    });
  }

  return {
    name: args.api.network.token.symbol,
    icon: args.api.network.token.image,
    quantity: bn(quantity, args.api.network.token.decimals),
    decimals: args.api.network.token.decimals,
    address: '_',
    type: 'fungible',
    malicious: false,
    pricing: {
      total: calculateTotalPrice({
        quantity,
        decimals: args.api.network.token.decimals,
        price: token_price_in_usd,
      }),
      one: token_price_in_usd,
    },
    preview: {
      significant: {},
      complementary: fields,
    },
  };
};
