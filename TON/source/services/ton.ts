import axios from 'axios';

import { PluginError } from '@lumoscompany/chainplugin';
import { Address } from 'ton-core';
import { TonClient } from 'ton';

const endpoint = (path: string): string => {
  let endpoint: string;
  if (globalEnvironment.isTestnetEnabled) {
    endpoint = `https://testnet.tonapi.io/v2/${path}`;
  } else {
    endpoint = `https://tonapi.io/v2/${path}`;
  }
  return endpoint;
};

const headers = (): object => {
  // const key = await globalEnvironment.readonlyKeyValueStrorage.value('tronscan_api_key');
  return {
    Authorization: 'AEDVDE6AV6PJVJIAAAAHVV5FYPNWX3WW2Z6QPFZTZ46PONUL6FDNGETXRF46NPQHDWG7DTQ',
    accept: 'application/json',
    'Accept-Language': 'en',
  };
};

const get = async <T extends object>(path: string, data: any): Promise<T> => {
  // const key = await globalEnvironment.readonlyKeyValueStrorage.value('tronscan_api_key');
  const response = await axios.get<T>(endpoint(path), {
    headers: headers(),
    params: data,
  });

  const value = response.data;
  if ('error' in value) {
    throw new PluginError(0, value.error as string);
  }

  return value;
};

const post = async <T extends object>(path: string, data: any): Promise<T> => {
  const response = await axios.post<T>(endpoint(path), data, {
    headers: headers(),
  });

  const value = response.data;
  if ('error' in value) {
    throw new PluginError(0, value.error as string);
  }

  return value;
};

namespace ton {
  export const jsonRPC = new TonClient({
    endpoint: (() => {
      if (globalEnvironment.isTestnetEnabled) {
        return `https://mainnet.tonhubapi.com/jsonRPC`;
      } else {
        return `https://mainnet.tonhubapi.com/jsonRPC`;
      }
    })(),
  });
}

namespace ton {
  export const TONAssetImage = {
    url: {
      string: 'https://ton.org/download/ton_symbol.png',
    },
  };

  export const addressFromRaw = (string: string | undefined): string => {
    if (!string) {
      return '';
    }
    return Address.parse(string).toString({ urlSafe: true });
  };
}

namespace ton {
  export type ImagePreview = {
    resolution: string;
    url: string;
  };
}

namespace ton {
  export type NftItemCollection = {
    address: string;
    name: string;
    description: string;
  };
}

namespace ton {
  export type Price = {
    value: string;
    token_name: string;
  };
}

namespace ton {
  export type NftItem = {
    address: string;
    index: number;
    owner?: AccountAddress;
    collection?: NftItemCollection;
    verified: boolean;

    metadata: {
      [key: string]: any;
    };

    sale?: {
      address: string;
      market: AccountAddress;
      owner?: AccountAddress;
      price: Price;
    };

    previews?: Array<ImagePreview>;
    dns?: string;
    approved_by: ('getgems' | 'tonkeeper' | string)[];
  };
}

namespace ton {
  export type JettonPreview = {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: 'whitelist' | 'blacklist' | 'none';
  };
}

namespace ton {
  export type EncryptedComment = {
    encryption_type: string;
    cipher_text: string;
  };
}

namespace ton {
  export type Refund = {
    type: 'DNS.ton' | 'DNS.tg' | 'GetGems' | string;
    origin: string;
  };
}

namespace ton {
  export type TonTransferAction = {
    sender: AccountAddress;
    recipient: AccountAddress;
    amount: number;
    comment?: string;
    encrypted_comment?: EncryptedComment;
    refund?: Refund;
  };
}

namespace ton {
  export type JettonTransferAction = {
    sender?: AccountAddress;
    recipient?: AccountAddress;
    senders_wallet: string;
    recipients_wallet: string;
    amount: string;
    comment?: string;
    encrypted_comment?: EncryptedComment;
    refund?: Refund;
    jetton: JettonPreview;
  };
}

namespace ton {
  export type NftItemTransferAction = {
    sender?: AccountAddress;
    recipient?: AccountAddress;
    nft: string;
    comment?: string;
    encrypted_comment?: EncryptedComment;
    payload?: string;
    refund?: Refund;
  };
}

namespace ton {
  export type ContractDeployAction = {
    address: string;
    interfaces: string[];
  };
}

namespace ton {
  export type SubscriptionAction = {
    subscriber: AccountAddress;
    subscription: string;
    beneficiary: AccountAddress;
    amount: number;
    initial: boolean;
  };
}

namespace ton {
  export type UnSubscriptionAction = {
    subscriber: AccountAddress;
    subscription: string;
    beneficiary: AccountAddress;
  };
}

namespace ton {
  export type AuctionBidAction = {
    auction_type: 'DNS.ton' | 'DNS.tg' | 'NUMBER.tg' | 'getgems' | string;
    amount: Price;
    nft?: NftItem;
    /**
     *
     * @type {AccountAddress}
     * @memberof AuctionBidAction
     */
    bidder: AccountAddress;
    /**
     *
     * @type {AccountAddress}
     * @memberof AuctionBidAction
     */
    auction: AccountAddress;
  };
}

namespace ton {
  export type NftPurchaseAction = {
    auction_type: 'DNS.tg' | 'getgems' | 'basic' | string;
    amount: Price;
    nft: NftItem;
    seller: AccountAddress;
    buyer: AccountAddress;
  };
}

namespace ton {
  export type DepositStakeAction = {
    amount: number;
    staker: AccountAddress;
  };
}
namespace ton {
  export type RecoverStakeAction = {
    amount: number;
    staker: AccountAddress;
  };
}

namespace ton {
  export type JettonSwapAction = {
    dex: 'stonfi' | 'dedust' | string;

    amount_in: string;
    amount_out: string;

    user_wallet: AccountAddress;
    router: AccountAddress;

    jetton_wallet_in: string;
    jetton_master_in: JettonPreview;

    jetton_wallet_out: string;
    jetton_master_out: JettonPreview;
  };
}

namespace ton {
  export type SmartContractAction = {
    executor: AccountAddress;
    contract: AccountAddress;
    ton_attached: number;
    operation: string;
    payload?: string;
    refund?: Refund;
  };
}
namespace ton {}

namespace ton {
  export type Action = {
    status: 'ok' | 'failed';

    TonTransfer?: TonTransferAction;
    JettonTransfer?: JettonTransferAction;
    NftItemTransfer?: NftItemTransferAction;

    ContractDeploy?: ContractDeployAction;

    Subscribe?: SubscriptionAction;
    UnSubscribe?: UnSubscriptionAction;

    AuctionBid?: AuctionBidAction;
    NftPurchase?: NftPurchaseAction;

    DepositStake?: DepositStakeAction;
    RecoverStake?: RecoverStakeAction;

    JettonSwap?: JettonSwapAction;
    SmartContractExec?: SmartContractAction;

    simple_preview: {
      name: string;
      description: string;
      actionImage?: string;
      value?: string;
      valueImage?: string;
      accounts: AccountAddress[];
    };
  };
}

namespace ton {
  export type AccountAddress = {
    address: string;
    is_scam: boolean;
    name?: string;
    icon?: string;
  };

  export type AccountEvent = {
    event_id: string;
    account: AccountAddress;
    timestamp: number;
    actions: Action[];
    is_scam: boolean;
    lt: number;
    in_progress: boolean;
    extra: number;
  };
}

namespace ton {
  export type RawAccountStatus = 'nonexist' | 'uninit' | 'active' | 'frozen';
}

namespace ton {
  export type RawMessage = {
    created_at: number;
    created_lt: number;

    ihr_disabled: boolean;

    bounce: boolean;
    bounced: boolean;

    value: number;

    fwd_fee: number;
    ihr_fee: number;
    import_fee: number;

    destination?: AccountAddress;
    source?: AccountAddress;

    init?: {
      boc: string;
    };

    op_code?: string;
    raw_body?: string;

    decoded_op_name?: string;
    decoded_body?: any | null;
  };
}

namespace ton {
  export type RawTransaction = {
    hash: string;
    lt: number;
    account: AccountAddress;

    success: boolean;
    utime: number;

    orig_status: RawAccountStatus;
    end_status: RawAccountStatus;

    total_fees: number;

    transaction_type:
      | 'TransOrd'
      | 'TransTickTock'
      | 'TransSplitPrepare'
      | 'TransSplitInstall'
      | 'TransMergePrepare'
      | 'TransMergeInstall'
      | 'TransStorage';

    state_update_old: string;
    state_update_new: string;

    in_msg?: RawMessage;
    out_msgs: Array<RawMessage>;

    block: string;

    prev_trans_hash?: string;
    prev_trans_lt?: number;

    compute_phase?: {
      skipped: boolean;
      skip_reason?: 'cskip_no_state' | 'cskip_bad_state' | 'cskip_no_gas';
      success?: boolean;
      gas_fees?: number;
      gas_used?: number;
      vm_steps?: number;
      exit_code?: number;
    };

    storage_phase?: {
      fees_collected: number;
      fees_due?: number;
      status_change: 'acst_unchanged' | 'acst_frozen' | 'acst_deleted';
    };

    credit_phase?: {
      fees_collected: number;
      credit: number;
    };

    action_phase?: {
      success: boolean;
      total_actions: number;
      skipped_actions: number;
      fwd_fees: number;
      total_fees: number;
    };

    bounce_phase?: 'TrPhaseBounceNegfunds' | 'TrPhaseBounceNofunds' | 'TrPhaseBounceOk';

    aborted: boolean;
    destroyed: boolean;
  };
}

namespace ton {
  export type GetAccountEventsRequest = {
    address: string;
    subject_only: boolean;
    limit: number;
    start_date?: number;
    end_date?: number;
    before_lt?: number;
  };

  export type GetAccountEventsResponse = {
    events: AccountEvent[];
    next_from: number;
  };

  export async function getAccountEvents(
    args: GetAccountEventsRequest
  ): Promise<GetAccountEventsResponse> {
    const address = args.address;
    delete args.address;
    return get<GetAccountEventsResponse>(`accounts/${address}/events`, args);
  }
}

namespace ton {
  export type GetRawTransactionRequest = {
    transaction_id: string;
  };

  export async function getRawTransaction(
    args: GetRawTransactionRequest
  ): Promise<RawTransaction | undefined> {
    return get<RawTransaction | undefined>(`blockchain/transactions/${args.transaction_id}`, {});
  }
}

namespace ton {
  export type GetJettonsRequest = {
    address: string;
  };

  export type GetJettonsResponse = {
    balances: {
      balance: string;
      walletAddress: AccountAddress;
      jetton: JettonPreview;
    }[];
  };

  export async function getJettons(args: GetJettonsRequest): Promise<GetJettonsResponse> {
    return get<GetJettonsResponse>(`accounts/${args.address}/jettons`, {});
  }
}

namespace ton {
  export type Account = {
    address: string;
    balance: number;
    last_activity: number;
    status: string;
    interfaces?: Array<string>;
    name?: string;
    is_scam?: boolean;
    icon?: string;
    memo_required?: boolean;
    get_methods: Array<string>;
  };
}

namespace ton {
  export type GetAccountRequest = {
    address: string;
  };

  export async function getAccount(args: GetAccountRequest): Promise<Account> {
    return get<Account>(`accounts/${args.address}`, {});
  }
}

namespace ton {
  export type GetRatesRequest = {
    tokens: ('TON' | string)[];
    currencies: string[];
  };

  export type GetRatesResponse = {
    rates: { [key: string]: { prices: { [key: string]: number } } };
  };

  export async function getRates(args: GetRatesRequest): Promise<GetRatesResponse> {
    return get<GetRatesResponse>(`rates`, {
      tokens: args.tokens.join(','),
      currencies: args.currencies.join(','),
    });
  }
}

namespace ton {
  export type EmulateEventRequest = {
    address: string;
    boc: string;
  };

  export async function emulate(args: EmulateEventRequest): Promise<AccountEvent> {
    return post<AccountEvent>(`accounts/${args.address}/events/emulate`, {
      boc: args.boc,
    });
  }
}

export { ton };
