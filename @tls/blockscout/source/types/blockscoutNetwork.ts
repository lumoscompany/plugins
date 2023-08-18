import { Image } from '@lumoscompany/chainplugin';
export type BlockscoutNetwork = {
  endpoints: {
    mainnet: string;
    testnet: string;
  };
  token: {
    image: Image;
    name: string;
    symbol: string;
    decimals: number;
  };
};
