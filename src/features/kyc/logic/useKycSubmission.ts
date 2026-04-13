import type { IProfileData } from 'InvestCommon/data/profiles/profiles.types';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import env from 'InvestCommon/config/env';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import type { KycSectionModels } from './useKycFormWorkflow';

export const KYC_STEP_ERROR_MESSAGES = {
  saveProfile: 'Failed to save KYC and financial information',
  syncUserPhone: 'Failed to update user phone',
  refreshUser: 'Failed to refresh user',
  launchKyc: 'Failed to handle Plaid KYC',
  createEscrow: 'Failed to create escrow',
} as const;

const runKycStep = async (
  action: () => Promise<unknown>,
  fallbackMessage: string,
) => {
  try {
    await action();
    return true;
  } catch (error) {
    reportError(error, fallbackMessage);
    return false;
  }
};

type ProfileSnapshot = {
  user_id?: string | number;
  id?: string | number;
  escrow_id?: string;
};

type SubmissionDependencies = {
  getSelectedProfileType: () => string;
  getSelectedProfileId: () => string | number;
  getSelectedProfileData: () => ProfileSnapshot | null | undefined;
  getUserEmail: () => string | undefined;
  saveProfile: (fields: IProfileData, type: string, id: string | number) => Promise<unknown>;
  syncUserPhone: (phone?: string) => Promise<unknown>;
  refreshUser: () => Promise<unknown>;
  launchKyc: (profileId: string | number) => Promise<unknown>;
  createEscrow: (userId: string | number, profileId: string | number) => Promise<unknown>;
};

type KycSubmissionResult = {
  hubspotPromise: Promise<void> | null;
};

const submitHubspotForms = async (
  sectionModels: KycSectionModels,
  email: string | undefined,
) => {
  await useHubspotForm(env.HUBSPOT_FORM_ID_FINANCIAL_SITUATION).submitFormToHubspot({
    email,
    is_accredited: (
      sectionModels.financial.accredited_investor as { is_accredited?: boolean } | undefined
    )?.is_accredited,
  });
  await useHubspotForm(env.HUBSPOT_FORM_ID_RISKS).submitFormToHubspot({
    email,
    ...sectionModels.understandingRisks,
  });
  await useHubspotForm(env.HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES).submitFormToHubspot({
    email,
    ...sectionModels.investmentObjectives,
  });
  await useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION).submitFormToHubspot({
    email,
    ...sectionModels.personal,
    date_of_birth: sectionModels.personal.dob,
  });
};

export function useKycSubmission({
  getSelectedProfileType,
  getSelectedProfileId,
  getSelectedProfileData,
  getUserEmail,
  saveProfile,
  syncUserPhone,
  refreshUser,
  launchKyc,
  createEscrow,
}: SubmissionDependencies) {
  const startBackgroundTasks = (
    fields: IProfileData & { phone?: string },
    sectionModels: KycSectionModels,
  ) => {
    void (async () => {
      const isUserUpdated = await runKycStep(
        () => syncUserPhone(fields.phone),
        KYC_STEP_ERROR_MESSAGES.syncUserPhone,
      );

      if (!isUserUpdated) {
        return;
      }

      await runKycStep(
        () => refreshUser(),
        KYC_STEP_ERROR_MESSAGES.refreshUser,
      );
    })();

    return (async () => {
      try {
        await submitHubspotForms(sectionModels, getUserEmail());
      } catch {}
    })();
  };

  const createEscrowIfNeeded = async () => {
    const profile = getSelectedProfileData();

    if (!profile?.user_id || !profile.id || profile.escrow_id) {
      return true;
    }

    return runKycStep(
      () => createEscrow(profile.user_id, profile.id),
      KYC_STEP_ERROR_MESSAGES.createEscrow,
    );
  };

  const submit = async (
    fields: IProfileData,
    sectionModels: KycSectionModels,
  ): Promise<KycSubmissionResult> => {
    let hubspotPromise: Promise<void> | null = null;

    let canContinue = await runKycStep(
      () => saveProfile(fields, getSelectedProfileType(), getSelectedProfileId()),
      KYC_STEP_ERROR_MESSAGES.saveProfile,
    );

    if (canContinue) {
      hubspotPromise = startBackgroundTasks(fields, sectionModels);
      canContinue = await runKycStep(
        () => launchKyc(getSelectedProfileId()),
        KYC_STEP_ERROR_MESSAGES.launchKyc,
      );
    }

    if (canContinue) {
      await createEscrowIfNeeded();
    }

    return {
      hubspotPromise,
    };
  };

  return {
    submit,
  };
}
