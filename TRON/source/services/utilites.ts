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

export function bn(value: string, decimals: number): string {
  const _value = BigInt(value);
  const _devider = BigInt(Math.pow(10, decimals));

  const l = _value / _devider;
  const r = _value % _devider;

  let result = `${l}`;
  if (r > BigInt(0)) {
    result =
      result +
      '.' +
      `${'0'.repeat(decimals)}${_value % _devider}`.slice(-decimals).replace(/0+$/, '');
  }

  return result;
}

export function defaults<T extends object>(relaxed: T, defaults: Partial<T>): T {
  const _defaults = defaults;
  Object.assign(_defaults, relaxed);
  return _defaults as any as T;
}
