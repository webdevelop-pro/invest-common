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
    };
  }
}
