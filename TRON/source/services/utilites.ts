import { Image } from '@lumoscompany/chainplugin';
import { tronscan } from './tronscan';
import { bn } from 'tlc-utilites';

export function imageWithTokenInfo(tokenInfo?: tronscan.TokenInfo): Image | undefined {
  if (tokenInfo && tokenInfo.tokenLogo && tokenInfo.tokenLogo.length > 0) {
    return {
      url: { string: tokenInfo.tokenLogo },
    };
  } else {
    return undefined;
  }
}

export function imageWithAsset(asset?: tronscan.Asset): Image | undefined {
  if (asset && asset.token_url && asset.token_url.length > 0) {
    return {
      url: { string: asset.token_url },
    };
  } else {
    return undefined;
  }
}

export { bn };

export function defaults<T extends object>(relaxed: T, defaults: Partial<T>): T {
  const _defaults = defaults;
  Object.assign(_defaults, relaxed);
  return _defaults as any as T;
}
