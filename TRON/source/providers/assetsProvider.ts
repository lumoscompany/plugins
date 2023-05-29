import {
  AssetsProvider as IAssetsProvider,
  FetchAssetsRequest,
  ComplementaryField,
  Asset,
} from '@lumoscompany/chainplugin';

import { tronscan, imageWithAsset } from '../services';

class AssetsProvider implements IAssetsProvider {
  async fetch(args: FetchAssetsRequest): Promise<Asset[]> {
    const assets = await tronscan.getAssets({ address: args.address, asset_type: 1 });
    return assets.data.map(asset => {
      const level = asset.level ?? 0;

      const address = asset.token_id;

      let name = asset.token_abbr;
      if (address === '_') {
        name = asset.token_abbr.toUpperCase();
      }

      const token_value_in_usd = parseFloat(asset.token_value_in_usd);
      const token_price_in_usd = parseFloat(asset.token_price_in_usd);

      const fields: ComplementaryField[] = [];
      if (token_price_in_usd > 0) {
        fields.push({
          name: 'Price',
          text: {
            value: asset.token_price_in_usd,
            currency: { abbreviation: 'USD' },
          },
        });
      }

      return {
        name: name,
        icon: imageWithAsset(asset),
        quantity: asset.balance,
        address: address,
        type: 'fungible',
        malicious: level > 2,
        pricing: {
          total: token_value_in_usd,
          one: token_price_in_usd,
        },
        preview: {
          significant: {},
          complementary: fields,
        },
      };
    });
  }
}

export { AssetsProvider };
