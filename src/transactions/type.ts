export enum TransactionType {
  Buy = 'buy',
  Sell = 'sell',
  BuyOnly = 'buy-only',
  SellOnly = 'sell-only'
}

export const isBuyLike = (type: TransactionType) => {
  switch (type) {
    case TransactionType.Buy:
    case TransactionType.BuyOnly:
      return true;
    default:
      return false;
  }
};

export const isSellLike = (type: TransactionType) => {
  switch (type) {
    case TransactionType.SellOnly:
    case TransactionType.Sell:
      return true;
    default:
      return false;
  }
};

export const isStrict = (type: TransactionType) => {
  switch (type) {
    case TransactionType.SellOnly:
    case TransactionType.BuyOnly:
      return true;
    default:
      return false;
  }
};

export function assetType(str: any): str is TransactionType {
  switch (str) {
    case TransactionType.Buy:
    case TransactionType.BuyOnly:
    case TransactionType.Sell:
    case TransactionType.SellOnly:
      return true;
    default:
      return false;
  }
}
