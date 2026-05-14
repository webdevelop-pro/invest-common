import type { IProfileData } from 'InvestCommon/data/profiles/profiles.types';
import type {
  FormChild,
  FormModelFinancialSituation,
  FormModelInvestmentObjectives,
  FormModelPersonalInformation,
  FormModelUnderstandRisks,
} from 'InvestCommon/types/form';
import type { ShallowRef } from 'vue';

export type KycFormSectionRef = Readonly<ShallowRef<FormChild | null>>;

export type KycFormSections = readonly KycFormSectionRef[];

type KycSectionModel<T extends object> = Partial<T> & Record<string, unknown>;

export type KycSectionModels = {
  personal: KycSectionModel<FormModelPersonalInformation>;
  financial: KycSectionModel<FormModelFinancialSituation>;
  investmentObjectives: KycSectionModel<FormModelInvestmentObjectives>;
  understandingRisks: KycSectionModel<FormModelUnderstandRisks>;
};

export type KycSubmissionFields = IProfileData & {
  consent_plaid?: unknown;
  phone?: string;
};

export const collectKycSectionModels = (
  [personalFormRef, financialInfoFormRef, investmentObjectivesFormRef, understandingRisksFormRef]: KycFormSections,
): KycSectionModels => ({
  personal: { ...(personalFormRef.value?.model ?? {}) } as KycSectionModels['personal'],
  financial: { ...(financialInfoFormRef.value?.model ?? {}) } as KycSectionModels['financial'],
  investmentObjectives: { ...(investmentObjectivesFormRef.value?.model ?? {}) } as KycSectionModels['investmentObjectives'],
  understandingRisks: { ...(understandingRisksFormRef.value?.model ?? {}) } as KycSectionModels['understandingRisks'],
});

export const collectKycSubmissionFields = (
  sectionModels: KycSectionModels,
): IProfileData & { phone?: string } => {
  const { personal, financial, investmentObjectives, understandingRisks } = sectionModels;
  return {
    first_name: personal.first_name,
    last_name: personal.last_name,
    middle_name: personal.middle_name,
    dob: personal.dob,
    address1: personal.address1,
    address2: personal.address2,
    city: personal.city,
    state: personal.state,
    zip_code: personal.zip_code,
    country: personal.country,
    phone: personal.phone,
    citizenship: personal.citizenship,
    ssn: personal.ssn,
    accredited_investor: financial.accredited_investor,
    investment_objectives: investmentObjectives.investment_objectives,
    educational_materials: understandingRisks.educational_materials,
    cancelation_restrictions: understandingRisks.cancelation_restrictions,
    resell_difficulties: understandingRisks.resell_difficulties,
    risk_involved: understandingRisks.risk_involved,
    no_legal_advices_from_company: understandingRisks.no_legal_advices_from_company,
  };
};
