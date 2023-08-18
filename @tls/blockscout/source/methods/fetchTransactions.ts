import {
  Event,
  CurrencyTextFormattingOptions,
  ComplementaryField,
  EventType,
  EventsProviderFetchRequest,
  FormattedText,
} from '@lumoscompany/chainplugin';

import { API, NextPageParameters, Transaction, TransactionStatus } from '../api';
import { bn } from '../utilites';

export const fetchTransactions = async (args: {
  api: API;
  request: EventsProviderFetchRequest;
}): Promise<Event[]> => {
  let events: Event[] = [];
  let next: NextPageParameters | undefined;

  while (true) {
    const result = await args.api.getTransactions({
      address: args.request.address,
      filter: undefined,
      next_page_params: next,
    });

    let transactions = result.items;
    let nextp = result.next_page_params;

    if ('before' in args.request) {
      const before = new Date(args.request.before * 1000);
      transactions = transactions.filter(t => {
        const date = new Date(t.timestamp);
        return date.getTime() < before.getTime();
      });
    } else {
      const after = new Date(args.request.after * 1000);
      transactions = transactions.filter(t => {
        const date = new Date(t.timestamp);
        return date.getTime() > after.getTime();
      });
    }

    const _events: (Event | undefined)[] = transactions.map(transaction =>
      parseTransaction(args.api, args.request.address, transaction)
    );

    events = events.concat(_events).filter(t => t !== undefined);
    next = nextp;

    if (transactions.length == 0 || transactions.length != result.items.length || !next) {
      break;
    }
  }

  return events.filter(e => e !== undefined);
};

export const fetchTransaction = async (args: {
  api: API;
  owner: string;
  hash: string;
}): Promise<Event | undefined> => {
  const transaction = await args.api.getTransaction({ hash: args.hash });
  if (transaction) {
    return parseTransaction(args.api, args.owner, transaction);
  } else {
    return undefined;
  }
};

export const fetchTransactionFees = async (args: {
  api: API;
  hash: string;
}): Promise<FormattedText | undefined> => {
  const transaction = await args.api.getTransaction({ hash: args.hash });
  if (!transaction || transaction.fee.type == 'maximum') {
    return undefined;
  } else {
    return {
      value: bn(transaction.fee.value, args.api.network.token.decimals),
      currency: {
        abbreviation: args.api.network.token.symbol,
      },
    };
  }
};

export const fetchTransactionStatus = async (args: {
  api: API;
  hash: string;
}): Promise<TransactionStatus | undefined> => {
  const transaction = await args.api.getTransaction({ hash: args.hash });
  if (!transaction) {
    return undefined;
  }
  return transaction.status;
};

const parseTransaction = (
  api: API,
  address: string,
  transaction: Transaction
): Event | undefined => {
  const date = new Date(transaction.timestamp);
  const fields: ComplementaryField[] = [];

  let type: EventType;
  let coptions: CurrencyTextFormattingOptions;

  if (transaction.tx_types && transaction.tx_types.includes('token_transfer')) {
    return undefined;
  }

  if (transaction.from.hash.toLowerCase() === address.toLocaleLowerCase()) {
    type = 'outcome-transaction';
    coptions = CurrencyTextFormattingOptions.NEGATIVE;
    fields.push({
      name: 'Recipient',
      text: {
        value: transaction.to.hash,
        copyable: true,
      },
    });
  } else {
    type = 'income-transaction';
    coptions = CurrencyTextFormattingOptions.POSITIVE;
    fields.push({
      name: 'Sender',
      text: {
        value: transaction.from.hash,
        copyable: true,
      },
    });
  }

  if (transaction.tx_types.includes('contract_call')) {
    if (transaction.method === 'approve') {
      type = 'Approval';
    } else {
      type = 'Contract execution';
    }
  }

  let incomplete = false;
  if (transaction.fee.type == 'maximum') {
    incomplete = true;
  } else {
    fields.push({
      name: 'Fees',
      text: {
        value: bn(transaction.fee.value, api.network.token.decimals),
        currency: {
          abbreviation: api.network.token.symbol,
        },
      },
    });
  }

  return {
    date: date.getTime() / 1000,
    hash: transaction.hash,
    malicious: false,
    asset: '_',
    incomplete: false,
    type: type,
    status: transaction.status === 'ok' ? 'success' : 'error',
    preview: {
      significant: {
        regular: {
          images: [api.network.token.image],
          text: {
            value: bn(transaction.value, api.network.token.decimals),
            currency: {
              abbreviation: api.network.token.symbol,
              options: coptions,
            },
          },
        },
      },
      complementary: fields,
    },
  };
};
