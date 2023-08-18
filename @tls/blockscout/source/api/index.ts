import { PluginError } from '@lumoscompany/chainplugin';
import { BlockscoutNetwork } from '../types';

import axios from 'axios';

type TokenBalance = {
  value: string;
  token_id: string;
  token: {
    name: string;
    decimals: string;
    symbol: string;
    address: string;
    type: 'ERC-20' | string;
    holders: number;
    exchange_rate: string;
    total_supply: string;
    icon_url?: string;
  };
};

type Address = {
  creator_address_hash?: string;
  creation_tx_hash?: string;
  coin_balance?: string; // ETH, 18 decimals
  exchange_rate?: string; // USD, float
  implementation_address?: string;
  block_number_balance_updated_at?: number;
  hash: string;
  implementation_name?: string;
  name?: string;
  is_contract: boolean;
  private_tags: any[];
  watchlist_names: any[];
  public_tags: any[];
  is_verified: boolean;
  has_beacon_chain_withdrawals: boolean;
  has_custom_methods_read: boolean;
  has_custom_methods_write: boolean;
  has_decompiled_code: boolean;
  has_logs: boolean;
  has_methods_read: boolean;
  has_methods_write: boolean;
  has_methods_read_proxy: boolean;
  has_methods_write_proxy: boolean;
  has_token_transfers: boolean;
  has_tokens: boolean;
  has_validated_blocks: boolean;
};

type DecodedInput = {};
type InternalTokenTransfer = {};
type TransactionStatus = 'ok' | 'error';

type Transaction = {
  timestamp: string; // example: 2022-08-02T07:18:05.000000Z
  fee: {
    type: 'maximum' | 'actual';
    value: string; // example: 9853224000000000
  };
  gas_limit: number;
  block: number; // (int32)
  status: TransactionStatus;
  method?: string; // example: transferFrom
  confirmations: number;
  type: number;
  exchange_rate: string; // example: 1866.51
  to: AddressParameter;
  tx_burnt_fee: string; // example: 1099596081903840
  max_fee_per_gas: string; // example: 55357460102
  result: string; // example: Error: (Awaiting internal transactions for reason)
  hash: string; // example: 0x5d90a9da2b8da402b11bc92c8011ec8a62a2d59da5c7ac4ae0f73ec51bb73368
  gas_price: string; // example: 26668595172
  priority_fee: string; // example: 2056916056308
  base_fee_per_gas: string; // example: 26618801760
  from: AddressParameter;
  token_transfers?: InternalTokenTransfer[];
  tx_types: (
    | 'token_transfer'
    | 'contract_creation'
    | 'contract_call'
    | 'token_creation'
    | 'coin_transfer'
  )[];
  gas_used: string; // example: 41309
  created_contract?: AddressParameter;
  position: number; // example: 117
  nonce: number; // example: 115
  has_error_in_internal_txs: boolean; // example: false
  // actions*	[TransactionAction{...}]
  decoded_input?: DecodedInput;
  token_transfers_overflow?: boolean; // example: false
  raw_input: string; // example: 0xa9059cbb000000000000000000000000ef8801eaf234ff82801821ffe2d78d60a0237f97000000000000000000000000000000000000000000000000000000003178cb80
  value: string; // example: 0
  max_priority_fee_per_gas: string; // example: 49793412
  revert_reason?: string; // example: Error: (Awaiting internal transactions for reason)
  confirmation_duration: number[]; // example: [ 0, 17479 ]
  tx_tag?: string; // example: private_tx_tag
};

type NextPageResponse<T> = {
  items: T[];
  next_page_params: NextPageParameters | undefined;
};

type NextPageParameters = {
  block_number: number;
  index: number;
};

type AddressParameter = {
  hash: string;

  implementation_name?: string;
  name?: string; // example: contractName

  is_contract: boolean;
  is_verified?: boolean;

  private_tags: [];
  watchlist_names: [];
  public_tags: [];
};

type TokenInformation = {
  circulating_market_cap: string; // example: 83606435600.3635
  icon_url?: string; // example: https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png
  name: string; // example: Tether USD
  decimals: string; // example: 6
  symbol: string; // example: USDT
  address: string; // example: 0x394c399dbA25B99Ab7708EdB505d755B3aa29997
  type: string; // example: ERC-20
  holders?: string; // example: 837494234523
  exchange_rate: string; // example: 0.99
  total_supply: string; // example: 10000000
};

type TokenTransfer = {
  block_hash: string;
  from: AddressParameter;
  to: AddressParameter;
  log_index: string; // example: 243
  method: string; // example: transfer
  timestamp: string; // example: 2023-07-03T20:09:59.000000Z
  token: TokenInformation;
  total: (TotalERC20 | TotalERC721 | TotalERC1155 | TotalERC1155Batch)[];
  tx_hash: string; // example: 0x6662ad1ad2ea899e9e27832dc202fd2ef915a5d2816c1142e6933cff93f7c592
  type: string; // example: token_transfer
};

type TotalERC20 = {
  decimals: string; // example: 18
  value: string; // example: 1000
};

type TotalERC721 = {};
type TotalERC1155 = {};
type TotalERC1155Batch = {};

class API {
  readonly network: BlockscoutNetwork;
  readonly endpoint: string;

  constructor(network: BlockscoutNetwork) {
    this.network = network;
    if (globalEnvironment.isTestnetEnabled) {
      this.endpoint = network.endpoints.testnet;
    } else {
      this.endpoint = network.endpoints.mainnet;
    }
  }

  async getAddress(args: { address: string }): Promise<Address> {
    return this._get<Address>(`/v2/addresses/${args.address}`, {});
  }

  async getTokenBalances(args: { address: string }): Promise<TokenBalance[]> {
    return this._get<TokenBalance[]>(`/v2/addresses/${args.address}/token-balances`, {});
  }

  async getTransactions(args: {
    address: string;
    filter: 'to' | 'from' | undefined;
    next_page_params: NextPageParameters | undefined;
  }): Promise<NextPageResponse<Transaction>> {
    const parameters = {};
    if (args.filter) {
      parameters['filter'] = args.filter;
    }

    if (args.next_page_params) {
      parameters['block_number'] = args.next_page_params.block_number;
      parameters['index'] = args.next_page_params.index;
    }

    return this._get<NextPageResponse<Transaction>>(
      `/v2/addresses/${args.address}/transactions`,
      parameters
    );
  }

  async getTransaction(args: { hash: string }): Promise<Transaction | undefined> {
    try {
      return await this._get<Transaction>(`/v2/transactions/${args.hash}`, {});
    } catch {
      return undefined;
    }
  }

  // TODO: Fix first request limit?
  async getTokenTransfers(args: {
    address: string;
    type: 'ERC-20';
    filter: 'to' | 'from' | undefined;
    next_page_params: NextPageParameters | undefined;
  }): Promise<NextPageResponse<TokenTransfer>> {
    const parameters = { type: args.type };
    if (args.filter) {
      parameters['filter'] = args.filter;
    }

    if (args.next_page_params) {
      parameters['block_number'] = args.next_page_params.block_number;
      parameters['index'] = args.next_page_params.index;
    }

    return this._get<NextPageResponse<TokenTransfer>>(
      `/v2/addresses/${args.address}/token-transfers`,
      parameters
    );
  }

  private async _get<T extends object>(path: string, data: any): Promise<T> {
    const endpoint = `${this.endpoint}${path}`;
    const response = await axios.get<T>(endpoint, {
      headers: {
        accept: 'application/json',
      },
      params: data,
    });

    const value = response.data;
    if ('error' in value) {
      throw new PluginError(0, value.error as string);
    }

    return value;
  }
}

export { API };
export type {
  TokenBalance,
  Transaction,
  TransactionStatus,
  NextPageParameters,
  AddressParameter,
  TokenInformation,
  TokenTransfer,
  TotalERC20,
  TotalERC721,
  TotalERC1155,
  TotalERC1155Batch,
};
