import { getAddress, keccak256 } from 'ethers';

import {
  AddressProvider as IAddressProvider,
  AddressValue,
  GenerateAddressRequest,
  ValidateAddressRequest,
} from '@lumoscompany/chainplugin';

class AddressProvider implements IAddressProvider {
  async generate(args: GenerateAddressRequest): Promise<AddressValue> {
    return {
      address: getAddress(keccak256('0x' + args.publicKey.substring(2)).substring(26)),
    };
  }

  async validate(args: ValidateAddressRequest): Promise<void> {
    if ('purpose' in args && 'transfeer' in args.purpose) {
      if (args.address.slice(-4) === '.eth') {
        return;
      } else {
        getAddress(args.address);
      }
    }
  }
}

export { AddressProvider };
