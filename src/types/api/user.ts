import {
  AccreditationTypes, IAccreditationData, IKycData, InvestKycTypes,
} from './invest';

export interface IEmployment {
  type: string;
}

export interface IBeneficiary {
  first_name: string;
  last_name: string;
  relationship_type: string;
  phone: string;
  email: string;
  dob: string;
}

export interface IFinra {
  member_association: boolean;
  correspondence: boolean;
  member_firm_name: string;
  compliance_contact_name: string;
  compliance_contant_email: string;
}

export interface IAccreditedInvestor {
  is_accredited: boolean;
}

export interface IInvestmentObjectives {
  objectives: string;
  years_experience: number;
  duration: string;
  importance_of_access: string;
  risk_comfort: string;
}
export interface ITenPercentShareholder {
  shareholder_association: boolean;
  ticker_symbol_list: string;
}
export interface ITypeOfId {
  type?: string;
  state?: string;
  id_number?: string;
  country?: string;
}
export interface IBusinessController {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  dob?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}
export interface IUserDataIndividual {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  dob?: string;
  phone?: string;
  email?: string;
  ssn?: string;
  address1?: string;
  address2?: string;
  type?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  citizenship?: string;
  nc_party_id?: string;
  nc_link_id?: string;
  employment: IEmployment;
  ip_address: string;
  beneficiary: IBeneficiary;
  risk_involved?: boolean;
  finra_affiliated: IFinra;
  accredited_investor: IAccreditedInvestor;
  resell_difficulties?: boolean;
  cancelation_restrictions?: boolean;
  educational_materials?: boolean;
  investment_objectives: IInvestmentObjectives;
  irs_backup_withholding?: boolean;
  ten_percent_shareholder?: ITenPercentShareholder;
  no_legal_advices_from_company?: boolean;
  name?: string;
  owner_title?: string;
  tax_exempts?: string;
  solely_for_investing?: string;
  business_controller?: IBusinessController;
  type_of_identification?: ITypeOfId;
  account_number?: string;
  full_account_name?: string;
  ein?: string;
}

export interface IWallet {
  id: number;
  status: string;
}

export interface IProfileIndividual {
  id: number;
  escrow_id?: string;
  type: string;
  data: IUserDataIndividual;
  kyc_id: number;
  kyc_status?: InvestKycTypes;
  kyc_data?: IKycData[];
  accreditation_id: number;
  accreditation_status?: AccreditationTypes;
  accreditation_data?: IAccreditationData[];
  kyc_at: string;
  accreditation_at: string;
  wallet: IWallet;
  total_distributions?: number;
  total_investments_12_months?: number;
  total_investments?: number;
  avarange_annual: number;
  total_investments_change_percent: number;
  total_distributions_change_percent: number;
  user_id?: number;
}

export interface ISchema {
  $schema: string;
  definitions: object;
  $ref: string;
}
