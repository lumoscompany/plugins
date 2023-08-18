import BigNumber from 'bignumber.js';
import { bn } from 'tlc-utilites';

export const calculateTotalPrice = (args: {
  quantity: string;
  decimals: number;
  price: number | undefined;
}): number => {
  if (args.price === undefined) {
    return 0;
  }

  const bnq = new BigNumber(bn(args.quantity, args.decimals));
  const result = new BigNumber(args.price).multipliedBy(bnq).toNumber();
  if (!result || result == 0) {
    return 0;
  }

  return Math.ceil(result * 1000) / 1000;
};

export { bn };
