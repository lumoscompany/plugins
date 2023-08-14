import {
  MessagesProvider as IMessagesProvider,
  BakeMessageRequest,
  BakedMessageData,
  SendMessageRequest,
  SendedMessageData,
  PluginError,
  MessageAuthor,
} from '@lumoscompany/chainplugin';

import {
  MessageRelaxed,
  WalletContractV4,
  internal,
  Builder,
  WalletContractV3R2,
  SendMode,
  beginCell,
  Cell,
  ContractProvider,
  Address,
  external,
  storeMessage,
} from 'ton';

import {
  createWalletTransferV3SigningMessage,
  createWalletTransferV4SigningMessage,
  getWalletContract,
  bn,
  ton,
} from '../services';

class MessagesProvider implements IMessagesProvider {
  private readonly client = ton.jsonRPC;

  constructor() {}

  async bake(args: BakeMessageRequest): Promise<BakedMessageData> {
    const transfer = args.message.transfer;
    const author = transfer.author;

    const wallet = getWalletContract(author);
    if (!wallet) {
      throw new PluginError(0, "Can't suggest wallet contract version for action");
    }

    const contract = this.client.open(wallet);
    const isWalletDeployed = await this.client.isContractDeployed(wallet.address);

    const balance = await contract.getBalance();
    const seqno = await contract.getSeqno();

    let sendmode: SendMode;
    let amount: bigint;

    const imessages: MessageRelaxed[] = [];

    if (transfer.asset === '_') {
      sendmode = SendMode.PAY_GAS_SEPARATELY;
      amount = BigInt(transfer.amount);

      imessages.push(
        internal({
          to: Address.parse(transfer.recipient),
          value: amount,
        })
      );
    } else {
      sendmode = SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS;
      amount = BigInt(640_000_000); // for a gas and etc.

      const authorJettonContractAddress = await this.resolveJettonAddressFor(
        Address.parse(transfer.asset),
        Address.parse(transfer.author.address)
      );

      if (!authorJettonContractAddress) {
        throw new PluginError(0, "Can't resolve author's jetton address");
      }

      imessages.push(
        internal({
          to: authorJettonContractAddress,
          bounce: true,
          value: amount,
          body: this.jettonTransferBody({
            jettonAmount: BigInt(transfer.amount),
            toAddress: Address.parse(transfer.recipient),
            responseAddress: Address.parse(transfer.author.address),
            forwardAmount: BigInt(1),
          }),
        })
      );
    }

    let emessage: Builder;
    if (wallet instanceof WalletContractV3R2) {
      emessage = createWalletTransferV3SigningMessage({
        seqno: seqno,
        sendMode: sendmode,
        messages: imessages,
        walletId: wallet.walletId,
      });
    } else if (wallet instanceof WalletContractV4) {
      emessage = createWalletTransferV4SigningMessage({
        seqno: seqno,
        sendMode: sendmode,
        messages: imessages,
        walletId: wallet.walletId,
      });
    } else {
      throw new PluginError(0, 'Unsupported wallet contract');
    }

    let estimatedFees = BigInt(0);
    try {
      const estimatedSignature = Buffer.alloc(64);
      const estimatedAction = await ton.emulate({
        address: transfer.author.address,
        boc: (() => {
          const body = beginCell().storeBuffer(estimatedSignature).storeBuilder(emessage).endCell();
          const ext = external({
            to: wallet.address,
            init: (() => {
              if (isWalletDeployed) {
                return null;
              }
              return contract.init;
            })(),
            body: body,
          });

          return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64');
        })(),
      });

      estimatedFees = BigInt(Math.abs(estimatedAction.extra)) - amount;
    } catch {}

    if (amount + estimatedFees > balance) {
      throw new PluginError(0, 'Not enough balance');
    }

    return {
      shouldSign: emessage.endCell().hash().toString('base64'),
      estimatedFees: `${bn(estimatedFees.toString(), 9)}`,
      extraData: emessage.endCell().toBoc().toString('base64'),
    };
  }

  async send(args: SendMessageRequest): Promise<SendedMessageData> {
    if (!args.bakedMessage.extraData) {
      throw new PluginError(0, "Can't parse internal transaction data");
    }

    const boc = Cell.fromBase64(args.bakedMessage.extraData);
    const signature = Buffer.from(args.userSignature, 'base64');
    const body = beginCell().storeBuffer(signature).storeSlice(boc.beginParse()).endCell();

    const provider = this.provider(args.originalMessage.transfer.author);
    await provider.external(body);

    return {
      originalMessage: args.originalMessage,
    };
  }

  private provider(author: MessageAuthor): ContractProvider {
    const wallet = getWalletContract(author);
    if (!wallet) {
      throw new PluginError(0, "Can't suggest wallet contract version for action");
    }

    return this.client.provider(wallet.address, wallet.init);
  }

  private async resolveJettonAddressFor(
    jettonMasterAddress: Address,
    recipientAddress: Address
  ): Promise<Address | undefined> {
    let waletAddress = await this.client.runMethod(jettonMasterAddress, 'get_wallet_address', [
      { type: 'slice', cell: beginCell().storeAddress(recipientAddress).endCell() },
    ]);

    try {
      const cell = waletAddress.stack.readCell();
      const address = cell.beginParse().loadAddress();
      return address;
    } catch {
      return undefined;
    }
  }

  private jettonTransferBody = (args: {
    jettonAmount: bigint;
    toAddress: Address;
    responseAddress: Address;
    forwardAmount: bigint;
  }) => {
    // transfer#f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
    //              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
    //              forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
    //              = InternalMsgBody;

    return beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(args.jettonAmount)
      .storeAddress(args.toAddress)
      .storeAddress(args.responseAddress)
      .storeMaybeRef(null)
      .storeCoins(args.forwardAmount)
      .storeMaybeRef(null)
      .endCell();
  };

  // EQDsg-2_eLAWtBuucEzbx5b54cCke-3r3QQ8h-0moA9cCp-E
}

export { MessagesProvider };
