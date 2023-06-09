/* eslint-disable @typescript-eslint/no-namespace */

import axios from 'axios';
import { defaults } from './utilites';
import { AbiCoder as ABI, decodeBase58 } from 'ethers';

const abi = new ABI();

const base58AddressToHEX = (base58: string): string => {
  return decodeBase58(base58)
    .toString(16) // hex
    .slice(0, -8) // checksum
    .replace(/^(41)/, '0x') // prefix
    .toLowerCase();
};

const post = async <T extends Object>(path: string, data: any): Promise<T> => {
  let endpoint: string;
  if (testnet) {
    endpoint = `https://api.shasta.trongrid.io/${path}`;
  } else {
    endpoint = `https://api.trongrid.io/${path}`;
  }

  const response = await axios.post<T>(endpoint, data);
  if ('Error' in response.data && typeof response.data.Error === 'string') {
    throw new Error(response.data.Error);
  } else {
    return response.data;
  }
};

namespace trongrid {
  export function isTRONAddress(value: string): boolean {
    try {
      return decodeBase58(value).toString(16).substring(0, 2) === '41';
    } catch {
      return false;
    }
  }
}

namespace trongrid {
  export type Transaction = {
    /**
     * Whehter the address is in Base58 format
     */
    visible: boolean;

    /**
     * A transaction hash
     * HEX
     */
    txID: string; // hash, hex

    /**
     * A transaction raw data
     */
    raw_data: {
      contract: {};
      ref_block_bytes: string; // hex,
      ref_block_hash: string; // hex
      expiration: number; // timestamp
      timestamp: number; // timestamp
    };

    /**
     * A transaction raw data
     * HEX
     */
    raw_data_hex: string; // hex
  };

  export type SignedTransaction = Transaction & {
    /**
     * List of signatures, HEX
     */
    signature: string[];
  };
}

namespace trongrid {
  export type CreateTRXTransactionRequest = {
    /**
     * A transfer sender address
     * HEX
     */
    owner_address: string;

    /**
     * A transfer receipt address
     * HEX
     */
    to_address: string;

    /**
     * The transfer amount
     * SUN (1 TRX = 1,000,000 SUN)
     * Int64
     */
    amount: number;

    /**
     * For multi-signature use, optional
     * Int32
     */
    permission_id?: number;

    /**
     * Whehter the address is in base58 format, optional
     * Int32
     */
    visible?: boolean;

    /**
     * Totes of a transaction, optional
     * HEX
     */
    extra_data?: string;
  };

  export const createTRXTransaction = async (
    args: CreateTRXTransactionRequest
  ): Promise<Transaction> => {
    return post<Transaction>('wallet/createtransaction', defaults(args, { visible: true }));
  };
}

namespace trongrid {
  export type CreateAssetTransactionRequest = CreateTRXTransactionRequest & {
    /**
     * Token address / ID / TRX10
     */
    asset_name: string;
  };

  export const createAssetTransaction = async (
    args: CreateAssetTransactionRequest
  ): Promise<Transaction> => {
    return post<Transaction>('wallet/transferasset', defaults(args, { visible: true }));
  };
}

namespace trongrid {
  export type CreateContractTransactionRequest = {
    /**
     * A transfer sender address
     * HEX
     */
    owner_address: string;

    /**
     * A transfer receipt address
     * HEX
     */
    to_address: string;

    /**
     * A contract to trigger address, TRC20
     * HEX
     */
    contract_address: string;

    /**
     * The transfer amount
     * BigInt
     */
    amount: bigint;

    /**
     * Maximum TRX consumption
     * SUN (1 TRX = 1,000,000 SUN)
     * Int64
     */
    fee_limit: number;

    /**
     * Amount of TRX transferred with this transaction
     * SUN (1 TRX = 1,000,000 SUN)
     * Int32
     */
    call_value?: number;

    /**
     * For multi-signature use, optional
     * Int64
     */
    permission_id?: number;

    /**
     * Whehter the address is in base58 format, optional
     * Int32
     */
    visible?: boolean;
  };

  export const createContractTransaction = async (
    args: CreateContractTransactionRequest
  ): Promise<Transaction> => {
    const parameters = abi
      .encode(['address', 'uint256'], [base58AddressToHEX(args.to_address), args.amount.toString()])
      .slice(2); // Remove `0x` prefix

    const updated = Object.assign(args, {
      function_selector: 'transfer(address,uint256)',
      parameter: parameters,
    });

    delete updated.amount;
    delete updated.to_address;

    const result = await post<{ transaction?: Transaction }>(
      'wallet/triggersmartcontract',
      defaults(updated, { call_value: 0, visible: true })
    );

    if (result.transaction) {
      return result.transaction;
    } else {
      throw new Error("Can't build TRX-20 transaction");
    }
  };
}

namespace trongrid {
  export type SendTransactionResponse = {
    /**
     * Whether the broadcast was successful.
     * true - successful;
     * false - failed, and this field will not be displayed in the returned result
     */
    result?: boolean;

    /**
     * A transaction hash,
     * HEX
     */
    txid: string;

    /**
     * Error code
     */
    code?: number;

    /**
     * Detailed error information
     */
    message?: string;
  };

  export const sendTransaction = async (
    args: SignedTransaction
  ): Promise<SendTransactionResponse> => {
    return post<SendTransactionResponse>('wallet/broadcasttransaction', args);
  };
}

export { trongrid };

/* eslint-enable @typescript-eslint/no-namespace */
