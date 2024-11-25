
import { IAccreditedInvestor, IInvestmentObjectives } from 'InvestCommon/types/api/user';

export interface FormChild {
    isValid: boolean;
    validation: unknown;
    model: object;
    onValidate: () => void;
}

export interface FormModelPersonalInformation {
  first_name: string;
  last_name: string;
  middle_name?: string;
  dob: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  citizenship: string;
  ssn: string;
}

export interface FormModelFinancialSituation {
  accredited_investor: IAccreditedInvestor;
}

export interface FormModelInvestmentObjectives {
  investment_objectives: IInvestmentObjectives;
}
export interface FormModelUnderstandRisks {
  educational_materials: boolean;
  cancelation_restrictions: boolean;
  resell_difficulties: boolean;
  risk_involved: boolean;
  no_legal_advices_from_company: boolean;
  consent_plaid: boolean;
}


export interface FormModelCreateProfileSelectType {
  type_profile: string;
}

export interface FormModelPartialIdentification {
  identification_type: string;
  identification_number: string;
  identification_state: string;
}


export interface FormModelResetPassword {
  first_name: string;
  last_name: string;
  email: string;
  create_password: string;
  repeat_password: string;
}

export interface FormModelBackgroundInformation {
  employment: {
    type: string;
    employer_name: string;
    role: string;
    address1: string;
    address2: string;
    city: string;
    postal_code: string;
  };
  finra_affiliated: {
    member_association: boolean;
    correspondence: boolean;
    member_firm_name: string;
    compliance_contract_name: string;
    compliance_contract_email: string;
  };
  ten_percent_shareholder: {
    shareholder_association: boolean;
    ticker_symbol_list: string;
  };
  irs_backup_withholding: boolean;
}
