import {
  MessagesProvider as IMessagesProvider,
  BakeMessageRequest,
  BakedMessageData,
  SendMessageRequest,
  SendedMessageData,
  PluginError,
} from '@lumoscompany/chainplugin';

import { trongrid } from '../services/index';
import { bn } from '../services/index';

type BakedTransaction = {
  transaction: trongrid.Transaction;
};

function BakedTransactionBase64(bakedTransaction: BakedTransaction): string {
  return Buffer.from(JSON.stringify(bakedTransaction), 'utf8').toString('base64');
}

function BakedTransactionFromBase64(string: string): BakedTransaction {
  return JSON.parse(Buffer.from(string, 'base64').toString('utf8'));
}

class MessagesProvider implements IMessagesProvider {
  constructor() {}

  async bake(args: BakeMessageRequest): Promise<BakedMessageData> {
    const transfer = args.message.transfer;

    let transaction: trongrid.Transaction;
    let estimatedFees: string = '0';

    if (transfer.asset === '_') {
      transaction = await trongrid.createTRXTransaction({
        owner_address: transfer.sender,
        to_address: transfer.recipient,
        amount: parseInt(transfer.amount),
      });
    } else if (trongrid.isTRONAddress(transfer.asset)) {
      const value = await trongrid.createContractTransaction({
        contract_address: transfer.asset,
        owner_address: transfer.sender,
        to_address: transfer.recipient,
        amount: BigInt(transfer.amount),
        fee_limit: 100_000_000,
      });

      transaction = value[0];
      estimatedFees = bn(value[1].toString(), 6);
    } else {
      transaction = await trongrid.createAssetTransaction({
        owner_address: transfer.sender,
        to_address: transfer.recipient,
        asset_name: transfer.asset,
        amount: parseInt(transfer.amount),
      });
    }

    return {
      shouldSign: Buffer.from(transaction.txID, 'hex').toString('base64'),
      estimatedFees: estimatedFees,
      extraData: BakedTransactionBase64({
        transaction: transaction,
      }),
    };
  }

  async send(args: SendMessageRequest): Promise<SendedMessageData> {
    if (!args.bakedMessage.extraData) {
      throw new PluginError(0, "Can't parse internal transaction data");
    }

    const bakedMessage = BakedTransactionFromBase64(args.bakedMessage.extraData);
    const signatureHEX = Buffer.from(args.userSignature, 'base64').toString('hex');

    const result = await trongrid.sendTransaction(
      Object.assign(bakedMessage.transaction, {
        signature: [signatureHEX],
      })
    );

    if (result.code) {
      throw new PluginError(result.code, result.message ?? '');
    }

    return {
      originalMessage: args.originalMessage,
      eventHash: result.txid,
    };
  }
}

export { MessagesProvider };
