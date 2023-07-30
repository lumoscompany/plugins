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

const _endpoint = (path: string): string => {
  let endpoint: string;
  if (globalEnvironment.isTestnetEnabled) {
    endpoint = `https://api.shasta.trongrid.io/${path}`;
  } else {
    endpoint = `https://api.trongrid.io/${path}`;
  }
  return endpoint;
};

const key = async (): Promise<string> => {
  const key = await globalEnvironment.readonlyKeyValueStrorage.value('trongrid_api_key');
  return key ?? '';
};

const get = async <T extends Object>(path: string, data: any): Promise<T> => {
  const response = await axios.get<T>(_endpoint(path), {
    headers: {
      'TRON-PRO-API-KEY': await key(),
    },
    params: data,
  });

  if ('Error' in response.data && typeof response.data.Error === 'string') {
    throw new Error(response.data.Error);
  } else {
    return response.data;
  }
};

const post = async <T extends Object>(path: string, data: any): Promise<T> => {
  const response = await axios.post<T>(_endpoint(path), data, {
    headers: {
      'TRON-PRO-API-KEY': await key(),
    },
  });

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

  type EstimatedFeesResponse = {
    result: {
      result: boolean;
    };

    energy_used: number; // int64, SUN
    energy_penalty?: number; // int64, SUN
  };

  export const createContractTransaction = async (
    args: CreateContractTransactionRequest
  ): Promise<[Transaction, number]> => {
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

    let transaction: Transaction;
    if (result.transaction) {
      transaction = result.transaction;
    } else {
      throw new Error("Can't build TRX-20 transaction");
    }

    const fees = await post<EstimatedFeesResponse>(
      'wallet/triggerconstantcontract',
      defaults(updated, { call_value: 0, visible: true })
    );

    let _fees = 0;
    if (fees.result.result) {
      let energy = fees.energy_used;
      if (fees.energy_penalty && fees.energy_penalty > energy) {
        energy -= fees.energy_penalty;
      }

      const cost = await getEnergyPrice();
      _fees = energy * cost;
    }

    return [transaction, _fees];
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

namespace trongrid {
  /**
   *
   * @returns 1 energy cost in TRX (SUN)
   */
  export const getEnergyPrice = async (): Promise<number> => {
    const _default = 420;

    const result = await get<{ prices?: string }>('wallet/getenergyprices', {});
    if (!result.prices) {
      return _default;
    }

    const elements = result.prices.split(',');
    if (elements.length == 0) {
      return _default;
    } else {
      const last = elements[elements.length - 1];
      const data = last.split(':');
      if (data.length != 2) {
        return _default;
      } else {
        const value = parseInt(data[1]);
        if (value) {
          return value;
        } else {
          return _default;
        }
      }
    }
  };
}

export { trongrid };

/* eslint-enable @typescript-eslint/no-namespace */
