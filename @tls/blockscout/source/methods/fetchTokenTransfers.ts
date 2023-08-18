import {
  Event,
  CurrencyTextFormattingOptions,
  EventType,
  ComplementaryField,
  EventsProviderFetchRequest,
  PluginError,
  Image,
} from '@lumoscompany/chainplugin';

import { API, NextPageParameters, TotalERC20 } from '../api';
import { bn } from '../utilites';

export const fetchTokenTransfers = async (args: {
  api: API;
  request: EventsProviderFetchRequest;
}): Promise<Event[]> => {
  let events: Event[] = [];
  let next: NextPageParameters | undefined;

  while (true) {
    const result = await args.api.getTokenTransfers({
      address: args.request.address,
      type: 'ERC-20',
      filter: undefined,
      next_page_params: next,
    });

    let transfers = result.items;
    let nextp = result.next_page_params;

    if ('before' in args.request) {
      const before = new Date(args.request.before * 1000);
      transfers = transfers.filter(t => {
        const date = new Date(t.timestamp);
        return date.getTime() < before.getTime();
      });
    } else {
      const after = new Date(args.request.after * 1000);
      transfers = transfers.filter(t => {
        const date = new Date(t.timestamp);
        return date.getTime() > after.getTime();
      });
    }

    const _events: (Event | undefined)[] = transfers.map(transfer => {
      const date = new Date(transfer.timestamp);
      const fields: ComplementaryField[] = [];

      let type: EventType;
      let coptions: CurrencyTextFormattingOptions;

      if (transfer.from.hash.toLowerCase() === args.request.address.toLocaleLowerCase()) {
        type = 'outcome-transaction';
        coptions = CurrencyTextFormattingOptions.NEGATIVE;
        fields.push({
          name: 'Recipient',
          text: {
            value: transfer.to.hash,
            copyable: true,
          },
        });
      } else {
        type = 'income-transaction';
        coptions = CurrencyTextFormattingOptions.POSITIVE;
        fields.push({
          name: 'Sender',
          text: {
            value: transfer.from.hash,
            copyable: true,
          },
        });
      }

      let total: TotalERC20;
      let decimals: number;
      if (!('value' in transfer.total)) {
        throw undefined;
      } else {
        total = transfer.total as any;
        decimals = parseInt(total.decimals) || args.api.network.token.decimals;
      }

      let images: Image[] = [];
      if (transfer.token.icon_url) {
        images.push({
          url: { string: transfer.token.icon_url },
        });
      }

      return {
        date: date.getTime() / 1000,
        hash: transfer.tx_hash,
        malicious: false,
        asset: transfer.token.address,
        incomplete: true,
        type: type,
        status: 'success',
        preview: {
          significant: {
            regular: {
              images: images,
              text: {
                value: bn(total.value, decimals),
                currency: {
                  abbreviation: transfer.token.symbol,
                  options: coptions,
                },
              },
            },
          },
          complementary: fields,
        },
      };
    });

    events = events.concat(_events).filter(t => t !== undefined);
    next = nextp;

    if (transfers.length == 0 || transfers.length != result.items.length || !next) {
      break;
    }
  }

  return events.filter(e => e !== undefined);
};
