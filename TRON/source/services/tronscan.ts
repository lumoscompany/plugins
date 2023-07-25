/* eslint-disable @typescript-eslint/no-namespace */

import axios from 'axios';
import { defaults } from './utilites';

const get = async <T>(path: string, data: any): Promise<T> => {
  let endpoint: string;
  if (testnet) {
    endpoint = `https://shastapi.tronscan.org/api/${path}`;
  } else {
    endpoint = `https://apilist.tronscanapi.com/api/${path}`;
  }

  const response = await axios.get<T>(endpoint, { params: data });
  return response.data;
};

namespace tronscan {
  export type TokenInfo = {
    tokenId: string;
    tokenDecimal: number;
    tokenAbbr: string;
    tokenLogo?: string;
    tokenCanShow: number;
  };
}

namespace tronscan {
  export type TRC10Transfer = {
    amount: string;
    transactionHash: string;
    transferFromAddress: string;
    transferToAddress: string;
    confirmed: boolean;
    timestamp: number;
    tokenInfo: TokenInfo;
  };

  export type GetTRC10TransfersRequest = {
    address: string;
    sort?: '-timestamp' | 'timestamp';
    count?: boolean;
    limit?: number;
    start?: number;
    filterTokenValue?: number;
    start_timestamp?: number;
    end_timestamp?: number;
  };

  export type GetTRC10TransfersResponse = {
    total: number;
    rangeTotal: number;
    data: [TRC10Transfer];
  };

  export const getTRC10Transfers = async (
    args: GetTRC10TransfersRequest
  ): Promise<GetTRC10TransfersResponse> => {
    return get<GetTRC10TransfersResponse>(
      'transfer',
      defaults(args, {
        address: '',
        sort: '-timestamp',
        count: true,
        limit: 50,
        start: 0,
        filterTokenValue: 0,
        start_timestamp: 0,
        end_timestamp: 0,
      })
    );
  };
}

namespace tronscan {
  export type TRC20TRC721Transfer = {
    quant: string;
    transaction_id: string; // hash
    from_address: string;
    to_address: string;
    contract_address: string;
    confirmed: boolean;
    block_ts: number; // timestamp
    event_type: 'Transfer';
    contract_type: 'trc20' | 'trc721';
    tokenInfo: TokenInfo;
    trigger_info: {
      method: string; //	transfer(address _to, uint256 _value)
      data: string;
      parameter: Record<string, any>; // _to, _value
      methodId: string;
      methodName: string;
      contract_address: string;
      call_value: number;
    };
  };

  export type GetTRC20TRC721TransfersRequest = {
    relatedAddress: string;
    sort?: '-timestamp' | 'timestamp';
    count?: boolean;
    limit?: number;
    start?: number;
    filterTokenValue?: number;
    start_timestamp?: number;
    end_timestamp?: number;
  };

  export type GetTRC20TRC721TransfersResponse = {
    total: number;
    rangeTotal: number;
    token_transfers: [TRC20TRC721Transfer];
  };

  export const getTRC20TRC721Transfers = async (
    args: GetTRC20TRC721TransfersRequest
  ): Promise<GetTRC20TRC721TransfersResponse> => {
    return get<GetTRC20TRC721TransfersResponse>(
      'token_trc20/transfers',
      defaults(args, {
        relatedAddress: '',
        sort: '-timestamp',
        count: true,
        limit: 50,
        start: 0,
        filterTokenValue: 0,
        start_timestamp: 0,
        end_timestamp: 0,
      })
    );
  };
}

namespace tronscan {
  export type TransactionResponse = {
    block: string;
    hash: string; // hash
    ownerAddress: string;
    toAddress: string;
    result: string; // SUCCESS of error message
    confirmations: number;
    confirmed: boolean;
    timestamp: number;
    trc20TransferInfo?: {
      icon_url?: string;
      symbol: string;
      level: number;
      to_address: string;
      contract_address: string;
      type: 'Transfer';
      decimals: number;
      name: string;
      vip: boolean;
      tokenType: 'trc20' | 'trc721';
      from_address: string;
      amount_str: string;
      status: number;
    }[];
    cost: {
      net_fee_cost: number;
      fee: number;
      energy_fee_cost: number;
      net_usage: number;
      multi_sign_fee: number;
      net_fee: number;
      energy_penalty_total: number;
      energy_usage: number;
      energy_fee: number;
      energy_usage_total: number;
      memoFee: number;
      origin_energy_usage: number;
      account_create_fee: number;
    };
  };

  export type TransactionRequest = {
    hash: string;
  };

  export const getTransaction = async (args: TransactionRequest): Promise<TransactionResponse> => {
    return get<TransactionResponse>('transaction-info', args);
  };
}

namespace tronscan {
  /**
   * 0 - All;
   * 1 - Assets (TRX, TRC10, TRC20);
   * 2 - Collectibles (TRC721 and TRC1155)
   */
  export type AssetType = 0 | 1 | 2;

  export type Asset = {
    frozen_token_value_in_usd: number;
    frozen: number;
    token_value: string;
    token_type: AssetType;
    token_price: number;
    token_decimal: number;
    token_value_in_usd?: string;
    token_price_in_usd?: string;
    token_id: string;
    token_abbr: string;
    balance: string;
    token_name: string;
    level?: number;
    pair_id: number;
    vip: boolean;
    token_url?: string;
  };

  export type GetAssetsResponse = {
    data: Asset[];
  };

  export type GetAssetsRequest = {
    address: string;
    asset_type: AssetType;
  };

  export const getAssets = async (args: GetAssetsRequest): Promise<GetAssetsResponse> => {
    return get<GetAssetsResponse>('account/wallet', args);
  };
}

export { tronscan };

/* eslint-enable @typescript-eslint/no-namespace */
