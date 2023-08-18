import chainplugin, { Chainplugin as IChainplugin } from '@lumoscompany/chainplugin';

import { BlockscoutProvider } from 'tlc-blockscout';
import { AddressProvider, MessagesProvider } from 'tlc-evm';

import { BrowserProvider } from './providers';

class Ethereum implements IChainplugin {
  private _blockscout = new BlockscoutProvider({
    endpoints: {
      mainnet: 'https://eth.blockscout.com/api',
      testnet: 'https://eth-goerli.blockscout.com/api',
    },
    token: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      image: {
        url: {
          string:
            'https://github.com/blockscout/docs/blob/master/.gitbook/assets/Ethereum.png?raw=true',
        },
      },
    },
  });

  private _browser = new BrowserProvider();
  private _address = new AddressProvider();

  constructor() {}

  async address(): Promise<AddressProvider> {
    return this._address;
  }

  async browser() {
    return this._browser;
  }

  async assets() {
    return this._blockscout;
  }

  async events() {
    return this._blockscout;
  }

  async messages() {
    const mkey = await globalEnvironment.readonlyKeyValueStrorage.value('ethereum_api_mkey');
    const tkey = await globalEnvironment.readonlyKeyValueStrorage.value('ethereum_api_tkey');
    return new MessagesProvider({
      chainIDs: {
        mainnet: 1,
        testnet: 5, // goerli
      },
      endpoints: {
        mainnet: `https://withered-late-ensemble.quiknode.pro/${mkey}/`,
        testnet: `https://rough-prettiest-bush.ethereum-goerli.quiknode.pro/${tkey}/`,
      },
    });
  }
}

export default chainplugin(Ethereum);
