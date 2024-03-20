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
import { Address } from '@ton/core';

type ActionParseResult = {
  images: Image[];
  complimentary: ComplementaryField[];

  text: FormattedText;
  type: EventType;
  asset: AssetAddress;
};

const parseSubscribe = (rawaddress: string, action: ton.SubscriptionAction): ActionParseResult => {
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
          value: ton.addressFromRaw(action.beneficiary.address, false),
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
  rawaddress: string,
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
          value: ton.addressFromRaw(action.beneficiary.address, false),
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
  rawaddress: string,
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
  rawaddress: string,
  action: ton.SmartContractAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [
      {
        name: 'Contract Address',
        text: {
          value: ton.addressFromRaw(action.contract.address, false),
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
  rawaddress: string,
  action: ton.ContractDeployAction
): ActionParseResult => {
  return {
    images: [ton.TONAssetImage],
    complimentary: [
      {
        name: 'Address',
        text: {
          value: ton.addressFromRaw(action.address, true),
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
  rawaddress: string,
  action: ton.NftItemTransferAction
): ActionParseResult => {
  return undefined;
};

const parseJettonSwap = (rawaddress: string, action: ton.JettonSwapAction): ActionParseResult => {
  var asset: AssetAddress;
  var text: FormattedText;

  const images: Image[] = [];
  const complimentary: ComplementaryField[] = [];

  if (action.jetton_master_in) {
    asset = action.jetton_master_in.address;
    images.push({
      url: { string: action.jetton_master_in.image },
    });
  } else if (action.ton_in) {
    asset = '_';
    images.push(ton.TONAssetImage);
  } else {
    return undefined;
  }

  if (action.jetton_master_out) {
    asset = `${asset}#~#${action.jetton_master_out.address}`;
    images.push({
      url: { string: action.jetton_master_out.image },
    });
  } else if (action.ton_out) {
    asset = `${asset}#~#_`;
    images.push(ton.TONAssetImage);
  } else {
    return undefined;
  }

  if (action.jetton_master_out && action.amount_out) {
    complimentary.push({
      name: 'Spended',
      text: {
        value: bn(`${action.amount_out}`, action.jetton_master_out.decimals),
        currency: {
          abbreviation: action.jetton_master_out.symbol,
          options: CurrencyTextFormattingOptions.NEGATIVE,
        },
      },
    });
  } else if (action.ton_out) {
    complimentary.push({
      name: 'Spended',
      text: {
        value: bn(`${action.ton_out}`, 9),
        currency: {
          abbreviation: 'TON',
          options: CurrencyTextFormattingOptions.NEGATIVE,
        },
      },
    });
  } else {
    return undefined;
  }

  complimentary.push({
    name: 'Router',
    text: {
      value: ton.addressFromRaw(action.router.address, false),
      copyable: true,
    },
  });

  if (action.jetton_master_in && action.amount_in) {
    text = {
      value: bn(`${action.amount_in}`, action.jetton_master_in.decimals),
      currency: {
        abbreviation: action.jetton_master_in.symbol,
        options: CurrencyTextFormattingOptions.POSITIVE,
      },
    };
  } else if (action.ton_in) {
    text = {
      value: bn(`${action.ton_in}`, 9),
      currency: {
        abbreviation: 'TON',
        options: CurrencyTextFormattingOptions.POSITIVE,
      },
    };
  } else {
    return undefined;
  }

  return {
    images: images,
    complimentary: complimentary,
    text: text,
    type: 'Jetton Swap',
    asset: asset,
  };
};

const parseJettonTransfer = (
  rawaddress: string,
  action: ton.JettonTransferAction
): ActionParseResult => {
  const complimentary: ComplementaryField[] = [];

  if (action.comment) {
    complimentary.push({
      prompt: action.comment,
      text: { value: '' },
    });
  }

  let type: EventType;
  let options: CurrencyTextFormattingOptions;

  if (action.sender?.address === rawaddress) {
    options = CurrencyTextFormattingOptions.NEGATIVE;
    type = 'outcome-transaction';
    complimentary.push({
      name: 'Recipient',
      text: {
        value: ton.addressFromRaw(action.recipient?.address, true),
        copyable: true,
      },
    });
  } else {
    options = CurrencyTextFormattingOptions.POSITIVE;
    type = 'income-transaction';
    complimentary.push({
      name: 'Sender',
      text: {
        value: ton.addressFromRaw(action.sender?.address, true),
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

const parseTONTransfer = (rawaddress: string, action: ton.TonTransferAction): ActionParseResult => {
  const complimentary: ComplementaryField[] = [];

  if (action.comment) {
    complimentary.push({
      prompt: action.comment,
      text: { value: '' },
    });
  }

  let type: EventType;
  let options: CurrencyTextFormattingOptions;

  if (action.sender.address === rawaddress) {
    options = CurrencyTextFormattingOptions.NEGATIVE;
    type = 'outcome-transaction';
    complimentary.push({
      name: 'Recipient',
      text: {
        value: ton.addressFromRaw(action.recipient.address, true),
        copyable: true,
      },
    });
  } else {
    options = CurrencyTextFormattingOptions.POSITIVE;
    type = 'income-transaction';
    complimentary.push({
      name: 'Sender',
      text: {
        value: ton.addressFromRaw(action.sender.address, true),
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
  const rawaddress = Address.parse(address).toRawString();

  let index = 0;
  action.actions.forEach(a => {
    let parsed: ActionParseResult | undefined = undefined;
    if (a.TonTransfer) {
      parsed = parseTONTransfer(rawaddress, a.TonTransfer);
    } else if (a.JettonTransfer) {
      parsed = parseJettonTransfer(rawaddress, a.JettonTransfer);
    } else if (a.JettonSwap) {
      parsed = parseJettonSwap(rawaddress, a.JettonSwap);
    } else if (a.NftItemTransfer) {
      parsed = parseNFTItemTransfer(rawaddress, a.NftItemTransfer);
    } else if (a.ContractDeploy) {
      parsed = parseContractDeploy(rawaddress, a.ContractDeploy);
    } else if (a.Subscribe) {
      parsed = parseSubscribe(rawaddress, a.Subscribe);
    } else if (a.UnSubscribe) {
      parsed = parseUnsubscribe(rawaddress, a.UnSubscribe);
    } else if (a.AuctionBid) {
      parsed = parseAuctionBid(rawaddress, a.AuctionBid);
    } else if (a.NftPurchase) {
      parsed = parseNFTPurchase(rawaddress, a.NftPurchase);
    } else if (a.DepositStake) {
      parsed = parseDepositStake(rawaddress, a.DepositStake);
    } else if (a.RecoverStake) {
      parsed = parseRecoverStake(rawaddress, a.RecoverStake);
    } else if (a.SmartContractExec) {
      parsed = parseSmartContractExecution(rawaddress, a.SmartContractExec);
    }

    if (!parsed) {
      return;
    }

    let status: EventStatus;
    if (action.in_progress) {
      status = 'pending';
      return; // ignore pending events for tmp
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
