
import { JSONSchemaType } from 'ajv';
import {
  address1Rule, address2Rule, citizenshipRule, cityRule, countryRuleObject,
  dobRule, emailRule, errorMessageRule, firstNameRule, lastNameRule,
  middleNameRule, phoneRule, relationshipTypeRule, ssnRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { EmploymentTypes } from 'InvestCommon/helpers/enums/general';
import { IAccreditedInvestor, IInvestmentObjectives } from 'InvestCommon/types/api/user';

export type FormModelPersonalInformation = {
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
};

export const schemaPersonalInformation = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    PatchIndividualProfile: {
      properties: {
        first_name: firstNameRule,
        last_name: lastNameRule,
        middle_name: middleNameRule,
        dob: dobRule,
        address1: address1Rule,
        address2: address2Rule,
        city: cityRule,
        state: stateRule,
        zip_code: zipRule,
        country: countryRuleObject,
        phone: phoneRule,
        citizenship: citizenshipRule,
        ssn: ssnRule,
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModelPersonalInformation>;

export const SELECT_OPTIONS_EMPLOYMENT = [
  {
    value: EmploymentTypes.full,
    text: 'Employed (full-time)',
  },
  {
    value: EmploymentTypes.part,
    text: 'Employed (part-time)',
  },
  {
    value: EmploymentTypes.self,
    text: 'Self-employed',
  },
  {
    value: EmploymentTypes.no,
    text: 'Not employed',
  },
  {
    value: EmploymentTypes.retired,
    text: 'Retired',
  },
  {
    value: EmploymentTypes.student,
    text: 'Student',
  },
];


export type FormModelBackgroundInformation = {
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
};


export type FormModelInvestmentsLimits = {
  accredited_investor: IAccreditedInvestor;
  investment_objectives: IInvestmentObjectives;
  educational_materials: boolean;
  cancelation_restrictions: boolean;
  resell_difficulties: boolean;
  risk_involved: boolean;
  no_legal_advices_from_company: boolean;
  consent_plaid: boolean;
};

export const isAccreditedRadioOptions = [
  {
    value: true,
    text: 'Yes',
  },
  {
    value: false,
    text: 'No',
  },
];


export type FormModelRisksInvolved = {
  educational_materials: boolean;
  cancelation_restrictions: boolean;
  resell_difficulties: boolean;
  risk_involved: boolean;
  no_legal_advices_from_company: boolean;
};

export type FormModeTrustedContact = {
  beneficiary: {
    first_name: string;
    last_name: string;
    relationship_type: string;
    phone: string;
    email: string;
    dob: string;
  };
}

export const schemaTrustedContact = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    TrustedContact: {
      properties: {
        first_name: firstNameRule,
        last_name: lastNameRule,
        relationship_type: relationshipTypeRule,
        phone: phoneRule,
        email: emailRule,
        dob: dobRule,
      },
      type: 'object',
      additionalProperties: false,
      required: ['first_name', 'last_name', 'relationship_type', 'phone', 'email', 'dob'],
    },
    PatchIndividualProfile: {
      properties: {
        beneficiary: { type: 'object', $ref: '#/definitions/TrustedContact' },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModeTrustedContact>;


export type FormModelFinancialInformationAndKYC = {
  citizenship: string;
  dob: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  accredited_investor: IAccreditedInvestor;
  investment_objectives: IInvestmentObjectives;
  educational_materials: boolean;
  cancelation_restrictions: boolean;
  resell_difficulties: boolean;
  risk_involved: boolean;
  no_legal_advices_from_company: boolean;
  consent_plaid: boolean;
};

export type FormModelAddTransaction= {
  amount: number;
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
