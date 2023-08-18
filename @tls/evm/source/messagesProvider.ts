import { JsonRpcProvider, Transaction, ethers, TransactionRequest, FeeData } from 'ethers';
import { bn } from 'tlc-utilites';

import {
  MessagesProvider as IMessagesProvider,
  BakeMessageRequest,
  BakedMessageData,
  SendMessageRequest,
  SendedMessageData,
  PluginError,
} from '@lumoscompany/chainplugin';

type MessagesProviderConfiguration = {
  chainIDs: {
    mainnet: number;
    testnet: number;
  };
  endpoints: {
    mainnet: string;
    testnet: string;
  };
};

const endpoint = (configuration: MessagesProviderConfiguration): string => {
  if (globalEnvironment.isTestnetEnabled) {
    return configuration.endpoints.testnet;
  } else {
    return configuration.endpoints.mainnet;
  }
};

const chainID = (configuration: MessagesProviderConfiguration): number => {
  if (globalEnvironment.isTestnetEnabled) {
    return configuration.chainIDs.testnet;
  } else {
    return configuration.chainIDs.mainnet;
  }
};

const erc20abi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
];

class MessagesProvider implements IMessagesProvider {
  readonly configuration: MessagesProviderConfiguration;
  readonly rpc: JsonRpcProvider;

  constructor(configuration: MessagesProviderConfiguration) {
    this.configuration = configuration;
    this.rpc = new ethers.JsonRpcProvider(endpoint(configuration));
  }

  async bake(args: BakeMessageRequest): Promise<BakedMessageData> {
    const gasPrice = await this.getFeeData();

    const transaction = new Transaction();
    transaction.chainId = chainID(this.configuration);
    transaction.type = 2;

    const sender = args.message.transfer.author.address;
    transaction.nonce = await this.rpc.getTransactionCount(sender, 'latest');

    transaction.gasPrice = null; // not used for EIP1559
    transaction.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas;
    transaction.maxFeePerGas = gasPrice.maxFeePerGas;

    const transfer = args.message.transfer;
    const amount = BigInt(transfer.amount);

    let nvalue: bigint;
    let recipient: string;

    try {
      recipient = await ethers.resolveAddress(transfer.recipient, this.rpc);
    } catch {
      throw new PluginError(0, `Can't resolve ${transfer.recipient} address`);
    }

    if (transfer.asset === '_') {
      nvalue = BigInt(transfer.amount);

      transaction.to = recipient;
      transaction.data = '0x';
    } else {
      nvalue = BigInt(0);

      const abi = new ethers.Interface(erc20abi);
      const erc20 = new ethers.Contract(transfer.asset, abi, this.rpc);

      const balance = await erc20['balanceOf(address)'](sender);
      if (amount > balance) {
        throw new PluginError(0, 'Not enough token balance');
      }

      const data = abi.encodeFunctionData('transfer', [recipient, transfer.amount]);

      transaction.to = transfer.asset;
      transaction.data = data;
    }

    transaction.value = nvalue;
    const gas = await this.estimateGas(
      Object.assign(
        {
          from: sender,
        },
        transaction
      )
    );

    const balance = await this.rpc.getBalance(transfer.author.address);
    const fees = gas * (gasPrice.maxFeePerGas + gasPrice.maxPriorityFeePerGas);
    if (fees + nvalue > balance) {
      throw new PluginError(0, 'Not enough balance');
    }

    transaction.gasLimit = gas;

    const hash = Buffer.from(transaction.unsignedHash.slice(2), 'hex');
    return {
      shouldSign: hash.toString('base64'),
      estimatedFees: `${bn(fees.toString(), 18)}`,
      extraData: Buffer.from(JSON.stringify(transaction), 'utf8').toString('base64'),
    };
  }

  async send(args: SendMessageRequest): Promise<SendedMessageData> {
    const data = JSON.parse(Buffer.from(args.bakedMessage.extraData, 'base64').toString('utf-8'));

    const transaction = Transaction.from(data);
    transaction.signature = `0x${Buffer.from(args.userSignature, 'base64').toString('hex')}`;

    this.rpc.send('eth_sendRawTransaction', [transaction.serialized]);

    return {
      originalMessage: args.originalMessage,
      eventHash: transaction.hash,
    };
  }

  async getFeeData(): Promise<FeeData> {
    return this.rpc.getFeeData();
  }

  async estimateGas(args: TransactionRequest): Promise<bigint> {
    return this.rpc.estimateGas(args);
  }
}

export { MessagesProvider, MessagesProviderConfiguration };
