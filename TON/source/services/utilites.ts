import { MessageAuthor } from '@lumoscompany/chainplugin';
import { WalletContractV3R2, WalletContractV4 } from '@ton/ton';
import { bn } from 'tlc-utilites';
import {
  Address,
  beginCell,
  MessageRelaxed,
  storeMessageRelaxed,
  SendMode,
  Builder,
} from '@ton/core';

export function defaults<T extends object>(relaxed: T, defaults: Partial<T>): T {
  const _defaults = defaults;
  Object.assign(_defaults, relaxed);
  return _defaults as any as T;
}

const getWalletContract = (
  author: MessageAuthor
): WalletContractV4 | WalletContractV3R2 | undefined => {
  const publicKey = Buffer.from(author.publicKey, 'hex');
  const address = Address.parse(author.address);

  const v4 = WalletContractV4.create({ workchain: 0, publicKey: publicKey });
  if (address.toRawString() === v4.address.toRawString()) {
    return v4;
  }

  const v3r2 = WalletContractV3R2.create({ workchain: 0, publicKey: publicKey });
  if (address.toRawString() === v3r2.address.toRawString()) {
    return v3r2;
  }

  return undefined;
};

const createWalletTransferV3SigningMessage = (args: {
  seqno: number;
  sendMode: SendMode;
  walletId: number;
  messages: MessageRelaxed[];
}): Builder => {
  let sendMode = SendMode.PAY_GAS_SEPARATELY;
  if (args.sendMode !== null && args.sendMode !== undefined) {
    sendMode = args.sendMode;
  }

  let rmessage = beginCell().storeUint(args.walletId, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      rmessage.storeBit(1);
    }
  } else {
    rmessage.storeUint(Math.floor(Date.now() / 1e3) + 60, 32); // 60 seconds, timeout
  }

  rmessage.storeUint(args.seqno, 32);
  for (let m of args.messages) {
    rmessage.storeUint(sendMode, 8);
    rmessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
  }

  return rmessage;
};

const createWalletTransferV4SigningMessage = (args: {
  seqno: number;
  sendMode: SendMode;
  walletId: number;
  messages: MessageRelaxed[];
}): Builder => {
  let sendMode = SendMode.PAY_GAS_SEPARATELY;
  if (args.sendMode !== null && args.sendMode !== undefined) {
    sendMode = args.sendMode;
  }

  let rmessage = beginCell();

  rmessage.storeUint(args.walletId, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      rmessage.storeBit(1);
    }
  } else {
    rmessage.storeUint(Math.floor(Date.now() / 1e3) + 60, 32); // 60 seconds, timeout
  }

  rmessage.storeUint(args.seqno, 32);
  rmessage.storeUint(0, 8); // Simple order
  for (let m of args.messages) {
    rmessage.storeUint(sendMode, 8);
    rmessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
  }

  return rmessage;
};

export {
  bn,
  getWalletContract,
  createWalletTransferV3SigningMessage,
  createWalletTransferV4SigningMessage,
};
