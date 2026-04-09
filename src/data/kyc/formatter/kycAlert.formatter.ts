import {
  InvestKycTypes,
  KycAlertModel,
  KycAlerts,
  KycTextStatuses,
} from '../kyc.types';

export interface KycAlertFormatterInput {
  isKycApproved?: boolean | null;
  isPlaidLoading?: boolean;
  status?: InvestKycTypes | null;
}

export const createHiddenKycAlertModel = (): KycAlertModel => ({
  show: false,
  variant: 'error',
  title: '',
  description: '',
  buttonText: undefined,
  isLoading: false,
  isDisabled: false,
});

export const formatKycAlertModel = ({
  isKycApproved = false,
  isPlaidLoading = false,
  status = InvestKycTypes.none,
}: KycAlertFormatterInput): KycAlertModel => {
  if (isKycApproved || status === InvestKycTypes.approved) {
    return createHiddenKycAlertModel();
  }

  const alert = KycAlerts[status];
  const statusText = KycTextStatuses[status];

  return {
    show: true,
    variant: status === InvestKycTypes.in_progress ? 'info' : 'error',
    title: alert.title,
    description: alert.description || '',
    buttonText: statusText.button ? statusText.text : undefined,
    isLoading: isPlaidLoading,
    isDisabled: isPlaidLoading,
  };
};
