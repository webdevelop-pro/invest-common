import type { IProfileData } from 'InvestCommon/data/profiles/profiles.types';
import type {
  FormChild,
  FormModelFinancialSituation,
  FormModelInvestmentObjectives,
  FormModelPersonalInformation,
  FormModelUnderstandRisks,
} from 'InvestCommon/types/form';
import type { Ref } from 'vue';

export type KycFormSectionRef = Ref<FormChild | null | undefined>;

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
  personalFormRef: KycFormSectionRef,
  financialInfoFormRef: KycFormSectionRef,
  investmentObjectivesFormRef: KycFormSectionRef,
  understandingRisksFormRef: KycFormSectionRef,
): KycSectionModels => ({
  personal: { ...(personalFormRef.value?.model ?? {}) } as KycSectionModels['personal'],
  financial: { ...(financialInfoFormRef.value?.model ?? {}) } as KycSectionModels['financial'],
  investmentObjectives: { ...(investmentObjectivesFormRef.value?.model ?? {}) } as KycSectionModels['investmentObjectives'],
  understandingRisks: { ...(understandingRisksFormRef.value?.model ?? {}) } as KycSectionModels['understandingRisks'],
});

export const collectKycSubmissionFields = (
  sectionModels: KycSectionModels,
): IProfileData & { phone?: string } => {
  const modelLocal = {
    ...sectionModels.personal,
    ...sectionModels.financial,
    ...sectionModels.investmentObjectives,
    ...sectionModels.understandingRisks,
  } as KycSubmissionFields;

  const { consent_plaid, ...fields } = modelLocal;
  return fields as IProfileData & { phone?: string };
};
