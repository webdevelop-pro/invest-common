import { IOwnership } from 'InvestCommon/types/api/invest';

export enum FundingStatusTypes {
  none = 'none',
  new = 'new',
  initialize = 'initialize',
  in_progress = 'in_progress',
  recieved = 'recieved',
  settled = 'settled',
  sent_back_pending = 'sent_back_pending',
  sent_back_settled = 'sent_back_settled',
  canceled = 'canceled',
}

export interface IFundingDataItem {
  payment_type: string;
  updated_at: string;
  status: string;
  number_of_shares: number;
  funding_type: string;
  amount: number;
  escrow_data: object;
  submited_at: string;
  step: string;
  escrow_type: string;
  signature_data: object;
  funding_status: FundingStatusTypes;
  profile_id: number;
  bank: {
    nc_account_nickname: string;
    nc_account_bank_name: string;
  };
  id: number;
}

export interface IBank {
  nickname: string;
  routing_number: string;
  account_number: string;
  account_type: string;
  bank_name: string;
}

export interface IFundingData {
  data: IFundingDataItem[];
  count: number;
  meta: {
    bank: IOwnership;
  };
}
