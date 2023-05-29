import { Image } from '@lumoscompany/chainplugin';
import { tronscan } from './tronscan';

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
