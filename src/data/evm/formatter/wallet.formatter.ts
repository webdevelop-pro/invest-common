import {
  IEvmWalletDataFormatted,
  IEvmWalletDataForFormatter,
  EvmWalletStatusTypes,
  IEvmWalletBalances,
  IEvmTransactionDataFormatted,
} from '../evm.types';
import { EvmTransactionFormatter } from './transactions.formatter';
import defaultImage from 'InvestCommon/shared/assets/images/default.svg?url';
import env from 'InvestCommon/domain/config/env';
import { currency } from 'InvestCommon/helpers/currency';

export class EvmWalletFormatter {
  private data: IEvmWalletDataForFormatter;

  constructor(data: IEvmWalletDataForFormatter) {
    this.data = data;
  }

  get isStatusCreated() {
    return this.data.status === EvmWalletStatusTypes.created;
  }

  get isStatusVerified() {
    return this.data.status === EvmWalletStatusTypes.verified;
  }

  get isStatusError() {
    return this.data.status === EvmWalletStatusTypes.error;
  }

  get isStatusErrorRetry() {
    return this.data.status === EvmWalletStatusTypes.error_retry;
  }

  get isStatusErrorDocument() {
    return this.data.status === EvmWalletStatusTypes.error_document;
  }

  get isStatusErrorPending() {
    return this.data.status === EvmWalletStatusTypes.error_pending;
  }

  get isStatusErrorSuspended() {
    return this.data.status === EvmWalletStatusTypes.error_suspended;
  }

  get isStatusAnyError() {
    return this.isStatusError || this.isStatusErrorRetry || this.isStatusErrorDocument
      || this.isStatusErrorPending || this.isStatusErrorSuspended;
  }

  get currentBalance() {
    return Number(this.data.balance) || 0;
  }

  get totalBalance() {
    return (this.currentBalance + this.pendingIncomingBalance - this.pendingOutcomingBalance) || 0;
  }

  get fundingBalance() {
    const balancesArray = this.getBalancesArray();
    const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'SUSD', 'GUSD'];

    return balancesArray.reduce((sum: number, balance: IEvmWalletBalances | Record<string, unknown>) => {
      const symbol = String((balance as IEvmWalletBalances).symbol || '').toUpperCase();
      const isStablecoin = stablecoinSymbols.includes(symbol);
      const amount = Number((balance as IEvmWalletBalances).amount ?? 0);
      return isStablecoin ? sum + amount : sum;
    }, 0);
  }

  get rwaValue() {
    const balancesArray = this.getBalancesArray();
    const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'SUSD', 'GUSD'];
    return balancesArray.reduce((sum: number, balance: IEvmWalletBalances | Record<string, unknown>) => {
      const b = balance as IEvmWalletBalances & { price_per_usd?: number };
      const symbol = String(b.symbol || '').toUpperCase();
      const isStablecoin = stablecoinSymbols.includes(symbol);
      const amount = Number(b.amount ?? 0);
      const pricePerUsd = Number(b.price_per_usd ?? 0);
      const valueUsd = amount * pricePerUsd;
      return !isStablecoin ? sum + valueUsd : sum;
    }, 0);
  }

  get pendingIncomingBalance() {
    return Number(this.data.inc_balance) || 0;
  }

  get pendingOutcomingBalance() {
    return Number(this.data.out_balance) || 0;
  }

  getImage(iconLinkId?: number | string, icon?: string, metaSize: 'big' | 'small' | 'medium' = 'small'): string {
    // Handle iconLinkId as number or string (number as string)
    const iconId = typeof iconLinkId === 'string' ? Number(iconLinkId) : iconLinkId;
    if (iconId && (iconId > 0)) {
      return `${env.FILER_URL}/public/files/${iconId}?size=${metaSize}`;
    }
    // If iconLinkId is a string that looks like a URL, use it
    if (typeof iconLinkId === 'string' && (iconLinkId.startsWith('http') || iconLinkId.startsWith('/'))) {
      return iconLinkId;
    }
    if (icon) {
      return icon;
    }
    return defaultImage;
  }

  /** Normalize balances to array (formatter accepts map or array). */
  private getBalancesArray(): (IEvmWalletBalances | Record<string, unknown>)[] {
    const raw = this.data.balances;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : Object.values(raw);
  }

  format(): IEvmWalletDataFormatted {
    const balancesArray: IEvmWalletBalances[] = this.getBalancesArray()
      .map((b: IEvmWalletBalances | Record<string, unknown>) => {
        const bal = b as IEvmWalletBalances & { price_per_usd?: number };
        const amount = Number(bal.amount ?? 0);

        let tokenValue: string | undefined;
        if (!amount) {
          tokenValue = currency(0);
        } else if (bal.price_per_usd !== undefined && bal.price_per_usd !== null) {
          const priceNum = Number(bal.price_per_usd);
          if (Number.isFinite(priceNum)) {
            tokenValue = currency(amount * priceNum);
          }
        }

        return {
          ...bal,
          address: String(bal.address),
          amount,
          symbol: String(bal.symbol ?? ''),
          name: bal.name ? String(bal.name) : undefined,
          icon: bal.icon ? this.getImage(bal.icon as string) : undefined,
          tokenValue,
        };
      })
      .filter((b: IEvmWalletBalances) => {
        const isUsdc = (b.symbol || '').toUpperCase() === 'USDC';
        return isUsdc || (Number(b.amount) > 0);
      });

    const formattedTransactions: IEvmTransactionDataFormatted[] = this.data.transactions?.map(transaction =>
      new EvmTransactionFormatter(transaction).format()
    ) ?? [];

    return {
      ...this.data,
      balances: balancesArray,
      isStatusCreated: this.isStatusCreated,
      isStatusVerified: this.isStatusVerified,
      isStatusError: this.isStatusError,
      isStatusErrorRetry: this.isStatusErrorRetry,
      isStatusErrorDocument: this.isStatusErrorDocument,
      isStatusErrorPending: this.isStatusErrorPending,
      isStatusErrorSuspended: this.isStatusErrorSuspended,
      isStatusAnyError: this.isStatusAnyError,
      currentBalance: this.currentBalance,
      totalBalance: this.totalBalance,
      fundingBalance: this.fundingBalance,
      rwaValue: this.rwaValue,
      pendingIncomingBalance: this.pendingIncomingBalance,
      pendingOutcomingBalance: this.pendingOutcomingBalance,
      formattedTransactions,
    };
  }
}
