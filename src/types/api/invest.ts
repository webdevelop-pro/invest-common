import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { IOffer } from './offers';
import { IProfileIndividual } from './user';

export enum InvestStepTypes {
  amount = 'amount',
  ownership = 'ownership',
  signature = 'signature',
  funding = 'funding',
  review = 'review',
}

export enum InvestKycTypes {
  none = 'none',
  new = 'new',
  pending = 'pending',
  approved = 'approved',
  declined = 'declined',
  in_progress = 'in_progress',
}

export enum AccreditationTypes {
  new = 'new',
  pending = 'pending',
  in_progress = 'in_progress',
  info_required = 'info_required',
  expired = 'expired',
  approved = 'approved',
  declined = 'declined',
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

export enum InvestmentStatuses {
  confirmed = 'confirmed',
  legally_confirmed = 'legally_confirmed',
  successfully_closed = 'successfully_closed',
  cancelled_after_investment = 'cancelled_after_investment',
}

export interface IKycData {
  completed_at: string;
  created_at: string;
  status: InvestKycTypes;
}

export interface IAccreditationData {
  completed_at: string;
  created_at: string;
  status: AccreditationTypes;
  notes?: string;
}

export interface IOwnership {
  first_name: string;
  last_name: string;
  middle_name: string;
  dob: string;
  phone: string;
  ssn: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  citizenship: string;
  nc_account_nickname?: string;
  nc_account_bank_name?: string;
}

export interface IBackgroundInfo {
  reg_cf?: {
    net_worth: number;
    annual_income: number;
    limitation_rule: boolean;
    invested_external: number;
    limitation_rule_confirmation: boolean;
  };
  accredited_investor?: {
    explanation: string;
    is_accredited: boolean;
  };
}

export interface IProfileData {
  id?: number;
  profile_id?: number;
  user_id?: number;
  escrow_id?: string;
  profile_type?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  dob?: string;
  phone?: string;
  ssn?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  citizenship?: string;
  nc_party_id?: string;
  nc_account_nickname?: string;
  nc_account_bank_name?: string;
  employment?: {
    type: string;
    employer_name?: string;
    role?: string;
    address1?: string;
    address2?: string;
    city?: string;
    postal_code?: string;
  };
  finra_affiliated?: {
    member_association: boolean;
    correspondence: boolean;
    member_firm_name: string;
    compliance_contact_name: string;
    compliance_contant_email: string;
  };
  ten_percent_shareholder?: {
    shareholder_association: boolean;
    ticker_symbol_list: string;
  };
  beneficiary?: {
    first_name: string;
    last_name: string;
    relationship_type: string;
    phone: string;
    email: string;
    dob: string;
  };
  investment_objectives?: {
    objectives: string;
    years_experience: number;
    duration: string;
    importance_of_access: string;
    risk_comfort: string;
  };
  accredited_investor?: {
    is_accredited: boolean;
  };
  reg_cf?: {
    limitation_rule: boolean;
    limitation_rule_confirmation: boolean;
    annual_income: number;
    net_worth: number;
    invested_external: number;
  };
  irs_backup_withholding?: boolean;
  educational_materials?: boolean;
  cancelation_restrictions?: boolean;
  resell_difficulties?: boolean;
  risk_involved?: boolean;
  no_legal_advices_from_company?: boolean;
  total_distributions?: number;
  total_investments_12_months?: number;
  total_investments?: number;
  kyc_status?: InvestKycTypes;
  kyc_data?: IKycData[];
  accreditation_status?:AccreditationTypes;
  accreditation_data?:IAccreditationData[];
  wallet_id?: number;
}

export interface IProfile {
  accreditation_status: AccreditationTypes;
  accreditation_data: IAccreditationData[];
  accreditation_id: string;
  id: number;
  user_id: number;
  escrow_id: string;
  kyc_at: string;
  accreditation_at: string;
  created_at: string;
  updated_at: string;
  kyc_status: InvestKycTypes;
  kyc_id: string;
  kyc_data: IKycData[];
  type: string;
  data: IOwnership;
  total_investments: number;
  total_investments_12_months: number;
  total_distributions: number;
  avarange_annual: number;
  wallet_id: number;
}

export interface IInvestStepOption {
  value: InvestStepTypes;
  title: string;
  done: boolean;
  to: {
    name: string;
    hash: string;
  };
}

export interface IInvestPaymentData {
  account_type: string;
  account_number: string;
  routing_number: string;
  account_holder_name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IInvest {
  amount: number;
  created_at: Date;
  submited_at: Date;
  closed_at: Date;
  funding_status: InvestFundingStatuses;
  funding_type: FundingTypes;
  id: number;
  number_of_shares: number;
  offer: IOffer;
  price_per_share: number;
  signature_data: {
    created_at: string;
    signature_id: string;
    provider: string;
  };
  status: InvestmentStatuses;
  step: InvestStepTypes;
  payment_data: IInvestPaymentData;
}

export interface ISignature {
  [key: string | number]: string;
}

export interface IInvestUnconfirmed {
  count: number;
  data: IInvest[];
}

export interface IInvestData {
  meta: {
    avarange_annual: number;
    total_distributions: number;
    total_investments_12_months: number;
    total_investments: number;
  };
  count: number;
  data: IInvestmentFormatted[];
}

export interface IInvestConfirm {
  investment: {
    id: number;
    status: string;
  };
}

export interface IInvestDocumentSign {
  sign_url: string;
  expires_at: number;
  signing_redirect_url: string;
  test_mode: boolean;
}

export interface IInvestFunding {
  funding_type: FundingTypes;
  payment_data?: {
    account_number: string;
    routing_number: string;
    account_holder_name: string;
    account_type: string;
  };
}

export interface IAccreditation {
  accreditation_data: IAccreditationData[];
  accreditation_status: AccreditationTypes;
}

export interface IInvestKyc {
  kyc_data: IKycData[];
  kyc_status: InvestKycTypes;
}

export interface IUserIdentityResponse {
  id: number;
  data: IBackgroundInfo;
  last_login: string;
  created_at: string;
  profiles: IProfileIndividual[];
}

export enum InvestmentDocumentsTypes {
  agreement = 'agreement',
  tax_document = 'tax document',
  offer_document = 'offer document',
}

export interface IInvestmentDocuments {
  id: number;
  url: string;
  name: string;
  filename: string;
  mime: string;
  bucket_path: string;
  updated_at: string;
  meta_data: {
    big: string;
    small: string;
    medium: string;
    size: number;
  };
  type: InvestmentDocumentsTypes;
}
