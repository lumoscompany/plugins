import {
  EventsProvider as IEventsProvider,
  Event,
  EventType,
  CurrencyTextFormattingOptions,
  EventHash,
  EventsProviderUpdateRequest,
  EventsProviderFetchRequest,
  EventsProviderStatusResponse,
  Image,
  AccountAddress,
  AssetAddress,
  FormattedText,
  ComplementaryField,
  EventStatus,
  PluginError,
} from '@lumoscompany/chainplugin';

import { ton, bn } from '../services';

type ActionParseResult = {
  images: Image[];
  complimentary: ComplementaryField[];

  text: FormattedText;
  type: EventType;
  asset: AssetAddress;
};

const parseSubscribe = (
  address: AccountAddress,
  action: ton.SubscriptionAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [
      {
        name: 'Subscription',
        text: {
          value: action.subscription,
          copyable: true,
        },
      },
      {
        name: 'Beneficiary',
        text: {
          value: ton.addressFromRaw(action.beneficiary.address),
          copyable: true,
        },
      },
    ],
    text: {
      value: bn(`${action.amount}`, 9),
      currency: {
        abbreviation: 'TON',
        options: CurrencyTextFormattingOptions.NEGATIVE,
      },
    },
    type: 'outcome-transaction',
    asset: `_`,
  };
};

const parseUnsubscribe = (
  address: AccountAddress,
  action: ton.UnSubscriptionAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [
      {
        name: 'Subscription',
        text: {
          value: action.subscription,
          copyable: true,
        },
      },
      {
        name: 'Beneficiary',
        text: {
          value: ton.addressFromRaw(action.beneficiary.address),
          copyable: true,
        },
      },
    ],
    text: {
      value: bn(`${0}`, 9),
      currency: {
        abbreviation: 'TON',
        options: CurrencyTextFormattingOptions.NEGATIVE,
      },
    },
    type: 'outcome-transaction',
    asset: `_`,
  };
};

const parseAuctionBid = (
  address: AccountAddress,
  action: ton.AuctionBidAction
): ActionParseResult | undefined => {
  return undefined;
};

const parseNFTPurchase = (
  address: AccountAddress,
  action: ton.NftPurchaseAction
): ActionParseResult | undefined => {
  return undefined;
};

const parseDepositStake = (
  address: AccountAddress,
  action: ton.DepositStakeAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [],
    text: {
      value: bn(`${action.amount}`, 9),
      currency: {
        abbreviation: 'TON',
        options: CurrencyTextFormattingOptions.NEGATIVE,
      },
    },
    type: 'Stake',
    asset: `_`,
  };
};

const parseRecoverStake = (
  address: AccountAddress,
  action: ton.RecoverStakeAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [],
    text: {
      value: bn(`${action.amount}`, 9),
      currency: {
        abbreviation: 'TON',
        options: CurrencyTextFormattingOptions.POSITIVE,
      },
    },
    type: 'Unsatake',
    asset: `_`,
  };
};

const parseSmartContractExecution = (
  address: AccountAddress,
  action: ton.SmartContractAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [
      {
        name: 'Contract Address',
        text: {
          value: ton.addressFromRaw(action.contract.address),
          copyable: true,
        },
      },
    ],
    text: {
      value: bn(`${action.ton_attached}`, 9),
      currency: {
        abbreviation: 'TON',
        options: CurrencyTextFormattingOptions.NEGATIVE,
      },
    },
    type: 'Contract Execution',
    asset: `_`,
  };
};

const parseContractDeploy = (
  address: AccountAddress,
  action: ton.ContractDeployAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [
      {
        name: 'Address',
        text: {
          value: ton.addressFromRaw(action.address),
          copyable: true,
        },
      },
    ],
    text: {
      value: bn(`${0}`, 9),
      currency: {
        abbreviation: 'TON',
        options: CurrencyTextFormattingOptions.NEGATIVE,
      },
    },
    type: 'Contract Deploy',
    asset: `_`,
  };
};

const parseNFTItemTransfer = (
  address: AccountAddress,
  action: ton.NftItemTransferAction
): ActionParseResult => {
  return undefined;
};

const parseJettonSwap = (
  address: AccountAddress,
  action: ton.JettonSwapAction
): ActionParseResult => {
  const complimentary: ComplementaryField[] = [];
  return {
    images: [
      {
        url: {
          string: action.jetton_master_in.image,
        },
      },
      {
        url: {
          string: action.jetton_master_out.image,
        },
      },
    ],
    complimentary: [
      {
        name: 'Spended',
        text: {
          value: bn(`${action.amount_out}`, action.jetton_master_out.decimals),
          currency: {
            abbreviation: action.jetton_master_out.symbol,
            options: CurrencyTextFormattingOptions.NEGATIVE,
          },
        },
      },
      {
        name: 'Router',
        text: {
          value: ton.addressFromRaw(action.router.address),
          copyable: true,
        },
      },
    ],
    text: {
      value: bn(`${action.amount_in}`, action.jetton_master_in.decimals),
      currency: {
        abbreviation: action.jetton_master_in.symbol,
        options: CurrencyTextFormattingOptions.POSITIVE,
      },
    },
    type: 'Jetton Swap',
    asset: `${action.jetton_master_in.address}#~#${action.jetton_master_out.address}`,
  };
};

const parseJettonTransfer = (
  address: AccountAddress,
  action: ton.JettonTransferAction
): ActionParseResult => {
  const complimentary: ComplementaryField[] = [];

  let type: EventType;
  let options: CurrencyTextFormattingOptions;

  if (ton.addressFromRaw(action.sender?.address) === address) {
    options = CurrencyTextFormattingOptions.NEGATIVE;
    type = 'outcome-transaction';
    complimentary.push({
      name: 'Recipient',
      text: {
        value: ton.addressFromRaw(action.recipient?.address),
        copyable: true,
      },
    });
  } else {
    options = CurrencyTextFormattingOptions.POSITIVE;
    type = 'income-transaction';
    complimentary.push({
      name: 'Sender',
      text: {
        value: ton.addressFromRaw(action.sender?.address),
        copyable: true,
      },
    });
  }

  return {
    images: [
      {
        url: {
          string: action.jetton.image,
        },
      },
    ],
    complimentary: complimentary,
    text: {
      value: bn(`${action.amount}`, action.jetton.decimals),
      currency: {
        abbreviation: action.jetton.symbol,
        options: options,
      },
    },
    type: type,
    asset: action.jetton.address,
  };
};

const parseTONTransfer = (
  address: AccountAddress,
  action: ton.TonTransferAction
): ActionParseResult => {
  const complimentary: ComplementaryField[] = [];

  let type: EventType;
  let options: CurrencyTextFormattingOptions;

  if (ton.addressFromRaw(action.sender.address) === address) {
    options = CurrencyTextFormattingOptions.NEGATIVE;
    type = 'outcome-transaction';
    complimentary.push({
      name: 'Recipient',
      text: {
        value: ton.addressFromRaw(action.recipient.address),
        copyable: true,
      },
    });
  } else {
    options = CurrencyTextFormattingOptions.POSITIVE;
    type = 'income-transaction';
    complimentary.push({
      name: 'Sender',
      text: {
        value: ton.addressFromRaw(action.sender.address),
        copyable: true,
      },
    });
  }

  return {
    images: [
      {
        url: {
          string: 'https://ton.org/download/ton_symbol.png',
        },
      },
    ],
    complimentary: complimentary,
    text: {
      value: bn(`${action.amount}`, 9),
      currency: {
        abbreviation: 'TON',
        options: options,
      },
    },
    type: type,
    asset: '_',
  };
};

const parse = (address: AccountAddress, action: ton.AccountEvent): Event[] => {
  const result: Event[] = [];
  let index = 0;

  action.actions.forEach(a => {
    let parsed: ActionParseResult | undefined = undefined;
    if (a.TonTransfer) {
      parsed = parseTONTransfer(address, a.TonTransfer);
    } else if (a.JettonTransfer) {
      parsed = parseJettonTransfer(address, a.JettonTransfer);
    } else if (a.JettonSwap) {
      parsed = parseJettonSwap(address, a.JettonSwap);
    } else if (a.NftItemTransfer) {
      parsed = parseNFTItemTransfer(address, a.NftItemTransfer);
    } else if (a.ContractDeploy) {
      parsed = parseContractDeploy(address, a.ContractDeploy);
    } else if (a.Subscribe) {
      parsed = parseSubscribe(address, a.Subscribe);
    } else if (a.UnSubscribe) {
      parsed = parseUnsubscribe(address, a.UnSubscribe);
    } else if (a.AuctionBid) {
      parsed = parseAuctionBid(address, a.AuctionBid);
    } else if (a.NftPurchase) {
      parsed = parseNFTPurchase(address, a.NftPurchase);
    } else if (a.DepositStake) {
      parsed = parseDepositStake(address, a.DepositStake);
    } else if (a.RecoverStake) {
      parsed = parseRecoverStake(address, a.RecoverStake);
    } else if (a.SmartContractExec) {
      parsed = parseSmartContractExecution(address, a.SmartContractExec);
    }

    if (!parsed) {
      return;
    }

    let status: EventStatus;
    if (action.in_progress) {
      status = 'pending';
    } else if (a.status === 'failed') {
      status = 'error';
    } else {
      status = 'success';
    }

    let hash = action.event_id;
    if (index > 0) {
      hash = `${hash}#~#${index}`;
    }

    result.push({
      hash: hash,
      date: parseFloat(`${action.timestamp}.${index}`),
      status: status,
      type: parsed.type,
      malicious: action.is_scam,
      incomplete: false,
      asset: parsed.asset,
      preview: {
        significant: {
          regular: {
            images: parsed.images,
            text: parsed.text,
          },
        },
        complementary: parsed.complimentary.concat([
          {
            name: action.extra > 0 ? 'Refund' : 'Fees',
            text: {
              value: bn(`${Math.abs(action.extra)}`, 9),
              currency: {
                abbreviation: 'TON',
              },
            },
          },
        ]),
      },
    });

    index = index + 1;
  });

  return result;
};

class EventsProvider implements IEventsProvider {
  constructor() {}

  async update(args: EventsProviderUpdateRequest): Promise<Event> {
    const _event = args.event;
    _event.incomplete = true;
    return _event;
  }

  async status(args: EventHash): Promise<EventsProviderStatusResponse> {
    throw new PluginError(0, 'Unsupported');
  }

  async fetch(args: EventsProviderFetchRequest): Promise<Event[]> {
    let start_timestamp: number | undefined;
    let end_timestamp: number | undefined;

    if ('after' in args) {
      start_timestamp = Math.ceil(args.after);
      end_timestamp = Math.ceil(new Date().getTime() / 1000);
    } else {
      start_timestamp = 0;
      end_timestamp = Math.ceil(args.before);
    }

    const page = 50;

    let events: ton.AccountEvent[] = [];
    let next_from_lt: number | undefined = undefined;

    while (true) {
      const request: ton.GetAccountEventsRequest = {
        address: args.address,
        subject_only: false,
        start_date: start_timestamp,
        limit: page,
        end_date: end_timestamp,
      };

      if (next_from_lt) {
        request.before_lt = next_from_lt;
      }

      let result: ton.GetAccountEventsResponse;
      try {
        result = await ton.getAccountEvents(request);
      } catch {
        break;
      }

      events = events.concat(result.events);

      if (result.events.length == 0 || result.events.length < page) {
        break;
      }

      next_from_lt = result.next_from;
    }

    return events.flatMap(event => parse(args.address, event));
  }
}

export { EventsProvider };
