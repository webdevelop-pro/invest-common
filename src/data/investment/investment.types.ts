import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { IOffer } from 'InvestCommon/types/api/offers';
import { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';

export enum InvestStepTypes {
  amount = 'amount',
  ownership = 'ownership',
  signature = 'signature',
  funding = 'funding',
  review = 'review',
}

export enum InvestmentStatuses {
  confirmed = 'confirmed',
  legally_confirmed = 'legally_confirmed',
  successfully_closed = 'successfully_closed',
  cancelled_after_investment = 'cancelled_after_investment',
}

export interface IInvestPaymentData {
  account_type: string;
  account_number: string;
  routing_number: string;
  account_holder_name: string;
  created_at?: Date;
  updated_at?: Date;
  transaction_id: string;
}

export interface ISignatureData {
  created_at: string;
  signature_id: string;
  entity_id: string;
  provider: string;
  ip_address: string;
  user_browser: string;
  signed_by_investor: boolean;
}

export enum InvestFundingStatuses {
  none = 'none',
  creation_error = 'creation_error',
  initialize = 'initialize',
  in_progress = 'in_progress',
  received = 'received',
  settled = 'settled',
  sent_back_pending = 'sent_back_pending',
  sent_back_settled = 'sent_back_settled',
  failed = 'failed',
  cancelled = 'cancelled',
  error = 'error',
}

export interface IEscrowData {
  pr_name: string;
  transaction_id: string;
  pr_approval_date: string;
  pr_approval_status: string;
}

export interface IInvestment {
  closed_at: Date;
  id: number;
  offer: IOffer;
  profile_id: number;
  user_id: number;
  price_per_share: number;
  number_of_shares: number;
  amount: number;
  step: InvestStepTypes;
  status: InvestmentStatuses;
  created_at: Date;
  submited_at: Date;
  funding_type: FundingTypes;
  funding_status: InvestFundingStatuses;
  signature_data: ISignatureData;
  escrow_data: IEscrowData;
  payment_data: IInvestPaymentData;
  payment_type: string;
  escrow_type: string;
  entity_id: string;
  transaction_ref: string;
}

export interface IInvestmentFormatted extends IInvestment {
  offer: IOfferFormatted;
  amountFormatted: string;
  amountFormattedZero: string;
  amountWithSign: string;
  numberOfSharesFormatted: string;
  pricePerShareFormatted: string;
  createdAtFormatted: string;
  createdAtTime: string;
  submitedAtFormatted: string;
  submitedAtTime: string;
  paymentDataCreatedAtFormatted: string;
  paymentDataCreatedAtTime: string;
  paymentDataUpdatedAtFormatted: string;
  paymentDataUpdatedAtTime: string;
  fundingStatusFormatted: string;
  fundingTypeFormatted: string;
  isFundingTypeWire: boolean;
  statusFormatted: {
    text: string;
    tooltip?: string;
    color: string;
  };
  isActive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isPending: boolean;
  isFundingClickable: boolean;
}

export interface IInvestmentsData {
  meta: {
    avarange_annual: number;
    total_distributions: number;
    total_investments_12_months: number;
    total_investments: number;
  };
  count: number;
  data: IInvestmentFormatted[];
}