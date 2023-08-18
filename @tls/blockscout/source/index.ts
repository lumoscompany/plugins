import {
  AssetsProvider,
  EventsProvider,
  FetchAssetsRequest,
  EventsProviderFetchRequest,
  EventsProviderUpdateRequest,
  EventsProviderStatusResponse,
  EventHash,
  Event,
} from '@lumoscompany/chainplugin';

import { API } from './api';
import { BlockscoutNetwork } from './types';

import {
  fetchOtherTokens,
  fetchTransactions,
  fetchTokenTransfers,
  fetchTransactionFees,
  fetchNativeToken,
  fetchTransactionStatus,
} from './methods';

class BlockscoutProvider implements AssetsProvider, EventsProvider {
  readonly api: API;

  constructor(network: BlockscoutNetwork) {
    this.api = new API(network);
  }

  async fetch(args: FetchAssetsRequest | EventsProviderFetchRequest): Promise<any> {
    if ('after' in args || 'before' in args) {
      let start_timestamp: number | undefined;
      let end_timestamp: number | undefined;

      if ('after' in args) {
        start_timestamp = Math.ceil(args.after);
        end_timestamp = Math.ceil(new Date().getTime() / 1000);
      } else {
        start_timestamp = 0;
        end_timestamp = Math.ceil(args.before);
      }

      const parameters = {
        api: this.api,
        request: args,
      };

      const transactions = await fetchTransactions(parameters);
      const tokentransfers = await fetchTokenTransfers(parameters);

      return transactions.concat(tokentransfers);
    } else {
      const parameters = {
        api: this.api,
        address: args.address,
      };

      const native = await fetchNativeToken(parameters);
      const others = await fetchOtherTokens(parameters);

      return [native].concat(others);
    }
  }

  async update(args: EventsProviderUpdateRequest): Promise<Event> {
    let _event = args.event;

    const fees = await fetchTransactionFees({ api: this.api, hash: args.event.hash });
    const fields = Object.assign([], _event.preview.complementary ?? []);

    if (fees) {
      fields.push({
        name: 'Fees',
        text: fees,
      });
    }

    _event.incomplete = false;
    _event.preview.complementary = fields;

    return _event;
  }

  async status(args: EventHash): Promise<EventsProviderStatusResponse> {
    const status = await fetchTransactionStatus({ api: this.api, hash: args.hash });
    if (!status) {
      return { status: 'pending' };
    } else if (status === 'ok') {
      return { status: 'success' };
    } else {
      return { status: 'error' };
    }
  }
}

export { BlockscoutProvider, BlockscoutNetwork };
