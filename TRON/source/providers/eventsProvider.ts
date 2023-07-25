import {
  EventsProvider as IEventsProvider,
  EventPreview,
  Event,
  EventType,
  CurrencyTextFormattingOptions,
  EventHash,
  EventsProviderUpdateRequest,
  EventsProviderFetchRequest,
  EventsProviderStatusResponse,
  Image,
  Environment,
} from '@lumoscompany/chainplugin';

import { tronscan, bn, imageWithTokenInfo } from '../services';

const currencyOptionsWithEventType = (
  type: EventType
): CurrencyTextFormattingOptions | undefined => {
  let options: CurrencyTextFormattingOptions | undefined = undefined;
  switch (type) {
    case 'income-transaction':
      options |= CurrencyTextFormattingOptions.POSITIVE;
      break;
    case 'outcome-transaction':
      options |= CurrencyTextFormattingOptions.NEGATIVE;
      break;
    default:
      break;
  }
  return options;
};

const significatImagesWithTokenInfo = (tokenInfo?: tronscan.TokenInfo): Image[] => {
  const images: Image[] = [];
  const image = imageWithTokenInfo(tokenInfo);
  if (image) {
    images.push(image);
  }
  return images;
};

const parseTRC20TRC721Transfer = (
  address: string,
  transfer: tronscan.TRC20TRC721Transfer
): [EventPreview, EventType] => {
  type _data = [string, string, EventType, string];
  const [_address, _amount, _type, _title]: _data = (() => {
    const value = bn(transfer.quant, transfer.tokenInfo.tokenDecimal);
    if (address === transfer.from_address) {
      return [transfer.to_address, `${value}`, 'outcome-transaction', 'Receipt'];
    } else {
      return [transfer.from_address, `${value}`, 'income-transaction', 'Sender'];
    }
  })();

  return [
    {
      significant: {
        regular: {
          images: significatImagesWithTokenInfo(transfer.tokenInfo),
          text: {
            value: `${_amount}`,
            currency: {
              abbreviation: transfer.tokenInfo.tokenAbbr.toUpperCase(),
              options: currencyOptionsWithEventType(_type),
            },
          },
        },
      },
      complementary: [
        {
          name: _title,
          text: { value: _address, copyable: true },
        },
      ],
    },
    _type,
  ];
};

const parseTRC10Transfer = (
  address: string,
  transfer: tronscan.TRC10Transfer
): [EventPreview, EventType] => {
  type _data = [string, string, EventType, string];
  const [_address, _amount, _type, _title]: _data = (() => {
    const value = bn(transfer.amount, transfer.tokenInfo.tokenDecimal);
    if (address === transfer.transferFromAddress) {
      return [transfer.transferToAddress, `${value}`, 'outcome-transaction', 'Receipt'];
    } else {
      return [transfer.transferFromAddress, `${value}`, 'income-transaction', 'Sender'];
    }
  })();

  return [
    {
      significant: {
        regular: {
          images: significatImagesWithTokenInfo(transfer.tokenInfo),
          text: {
            value: `${_amount}`,
            currency: {
              abbreviation: transfer.tokenInfo.tokenAbbr.toUpperCase(),
              options: currencyOptionsWithEventType(_type),
            },
          },
        },
      },
      complementary: [
        {
          name: _title,
          text: { value: _address, copyable: true },
        },
      ],
    },
    _type,
  ];
};

class EventsProvider implements IEventsProvider {
  environment: Environment;

  constructor(environment: Environment) {
    this.environment = environment;
  }

  async update(args: EventsProviderUpdateRequest): Promise<Event> {
    const response = await tronscan.getTransaction({ hash: args.event.hash });
    const fee = bn(`${response.cost.energy_fee}`, 6);

    const _event = args.event;
    _event.incomplete = false;

    let complementary = Object.assign([], _event.preview.complementary);
    complementary.push({
      name: 'Fees',
      text: {
        value: `${fee} TRX`,
      },
    });

    _event.preview.complementary = complementary;
    return _event;
  }

  async status(args: EventHash): Promise<EventsProviderStatusResponse> {
    const response = await tronscan.getTransaction({ hash: args.hash });
    const status = response.contractRet;
    switch (status) {
      case 'SUCCESS':
        return { status: 'success' };
      default:
        return { status: 'failed' };
    }
  }

  async fetch(args: EventsProviderFetchRequest): Promise<Event[]> {
    let start_timestamp: number | undefined;
    let end_timestamp: number | undefined;

    if ('after' in args) {
      start_timestamp = args.after * 1000;
    } else {
      start_timestamp = 1529856000000; // default TRON
      end_timestamp = args.before * 1000;
    }

    const page = 1000;
    const transfers: [tronscan.TRC10Transfer[], tronscan.TRC20TRC721Transfer[]] = [[], []];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (transfers[0].length % page == 0) {
        const response = await tronscan.getTRC10Transfers({
          address: args.address,
          start_timestamp: start_timestamp,
          end_timestamp: end_timestamp,
          start: transfers[0].length,
          limit: page,
        });

        transfers[0] = transfers[0].concat(response.data);
      }

      if (transfers[1].length % page == 0) {
        const response = await tronscan.getTRC20TRC721Transfers({
          relatedAddress: args.address,
          start_timestamp: start_timestamp,
          end_timestamp: end_timestamp,
          start: transfers[1].length,
          limit: page,
        });

        transfers[1] = transfers[1].concat(response.token_transfers);
      }

      if (transfers[0].length % page >= 0 && transfers[1].length % page >= 0) {
        break;
      }
    }

    const trc10: Event[] = transfers[0].map(transfer => {
      const parsed = parseTRC10Transfer(args.address, transfer);
      return {
        date: transfer.timestamp / 1000,
        hash: transfer.transactionHash,
        status: 'success',
        malicious: transfer.tokenInfo.tokenCanShow > 2,
        asset: transfer.tokenInfo.tokenId,
        incomplete: true,
        type: parsed[1],
        preview: parsed[0],
      };
    });

    const trc20trc721: Event[] = transfers[1].map(transfer => {
      const parsed = parseTRC20TRC721Transfer(args.address, transfer);
      return {
        date: transfer.block_ts / 1000,
        hash: transfer.transaction_id,
        status: 'success',
        malicious: transfer.tokenInfo.tokenCanShow > 2,
        asset: transfer.contract_address,
        incomplete: true,
        type: parsed[1],
        preview: parsed[0],
      };
    });

    return [...trc10, ...trc20trc721].sort((lhs, rhs) => {
      return lhs.date < rhs.date ? 1 : 0;
    });
  }
}

export { EventsProvider };
