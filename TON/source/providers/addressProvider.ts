import {
  AddressProvider as IAddressProvider,
  GenerateAddressRequest,
  ValidateAddressRequest,
  AddressValue,
} from '@lumoscompany/chainplugin';

import { Address, WalletContractV3R2, WalletContractV4 } from 'ton';
import { ton } from '../services';

class AddressProvider implements IAddressProvider {
  constructor() {}

  async generate(args: GenerateAddressRequest): Promise<AddressValue> {
    const client = ton.jsonRPC;
    const publicKey = Buffer.from(args.publicKey, 'hex');

    const v4 = WalletContractV4.create({ workchain: 0, publicKey: publicKey });
    const v4_balance = (await client.provider(v4.address, null).getState()).balance;

    const v3 = WalletContractV3R2.create({ workchain: 0, publicKey: publicKey });
    const v3_balance = (await client.provider(v3.address, null).getState()).balance;

    let address = v4.address;
    if (v3_balance > v4_balance) {
      address = v3.address;
    }

    return {
      address: address.toString({ urlSafe: true }),
    };
  }

  async validate(args: ValidateAddressRequest): Promise<void> {
    if (args.purpose && 'transfer' in args.purpose && ton.isDNSAddress(args.address)) {
      // Allow DNS only for a transfers
      return;
    }

    Address.parse(args.address);
  }
}

export { AddressProvider };
