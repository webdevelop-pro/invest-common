import { 
  IEvmTransactionDataResponse, 
  IEvmTransactionDataFormatted, 
  EvmTransactionStatusTypes,
  EvmTransactionTypes 
} from '../evm.types';

export class EvmTransactionFormatter {
  private data: IEvmTransactionDataResponse;

  constructor(data: IEvmTransactionDataResponse) {
    this.data = data;
  }

  format(): IEvmTransactionDataFormatted {
    return {
      ...this.data,
      isStatusPending: this.data.status === EvmTransactionStatusTypes.pending,
      isStatusProcessed: this.data.status === EvmTransactionStatusTypes.processed,
      isStatusFailed: this.data.status === EvmTransactionStatusTypes.failed,
      isStatusCancelled: this.data.status === EvmTransactionStatusTypes.cancelled,
      isTypeDeposit: this.data.type === EvmTransactionTypes.deposit,
      isTypeWithdraw: this.data.type === EvmTransactionTypes.withdrawal,
      isTypeInvestment: this.data.type === EvmTransactionTypes.investment,
      isTypeDistribution: this.data.type === EvmTransactionTypes.distribution,
      isTypeFee: this.data.type === EvmTransactionTypes.fee,
      isTypeSale: this.data.type === EvmTransactionTypes.sale,
      isTypeReturn: this.data.type === EvmTransactionTypes.return,
      isTypeMarket: this.data.type === EvmTransactionTypes.market,
    };
  }
}
