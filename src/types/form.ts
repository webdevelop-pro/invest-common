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
  ssn?: string;
  ein?: string;
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
    title: string;
    address1: string;
    address2: string;
    city: string;
    zip_code: string;
  };
  finra_affiliated: {
    member_association: boolean;
    correspondence: boolean;
    member_firm_name: string;
    compliance_contact_name: string;
    compliance_contant_email: string;
  };
  ten_percent_shareholder: {
    shareholder_association: boolean;
    ticker_symbol_list: string;
  };
  irs_backup_withholding: boolean;
}

export interface FormModeTrustedContact {
  beneficiary: {
    first_name: string;
    last_name: string;
    relationship_type: string;
    phone: string;
    email: string;
    dob: string;
  };
}

export interface FormModelAddTransaction {
  amount: number;
  funding_source_id: number | string;
}

export interface IValidationFields {
  description1: string;
  description2: string;
  description3: string;
  description4: string;
  description5: string;
  description6: string;
  note: string;
}

export interface IFilesData {
  files: File[];
  descriptions: string[];
}

export type TFields = keyof IValidationFields;

export type FormModelAccreditationFileInput = {
  description1: string;
  description2: string;
  description3: string;
  description4: string;
  description5: string;
  description6: string;
  note: string;
}

export type FormModelContactUs = {
  name: string;
  email: string;
  subject: string;
  message: string;
}
