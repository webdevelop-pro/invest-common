import { InvestKycTypes } from 'InvestCommon/types/api/invest';

export interface IKycTokenResponse {
  expiration: string;
  link_token: string;
  request_id: string;
}

export interface IKycIdentity {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface IKycData {
  completed_at: string;
  created_at: string;
  status: string;
}

export interface IKycProfile {
  id: number;
  user_id: number;
  kyc_status: string;
  kyc_data: IKycData[];
  created_at: string;
  updated_at: string;
}

interface ITextStatuses {
  text: string;
  class: string;
  button?: boolean;
  tooltip?: string;
  mobileText?: string;
}

export const KycTextStatuses: Record<InvestKycTypes, ITextStatuses> = {
  [InvestKycTypes.none]: {
    text: 'Verify Identity',
    mobileText: 'Verify',
    class: 'none',
    button: true,
  },
  [InvestKycTypes.new]: {
    text: 'Verify Identity',
    mobileText: 'Verify',
    class: 'none',
    button: true,
  },
  [InvestKycTypes.declined]: {
    text: 'Declined',
    class: 'failed',
  },
  [InvestKycTypes.pending]: {
    text: 'Continue',
    class: 'pending',
    button: true,
  },
  [InvestKycTypes.in_progress]: {
    text: 'Verification In Progress',
    mobileText: 'In Progress',
    class: 'pending',
    tooltip: 'Pending until all associated parties complete KYC.',
  },
  [InvestKycTypes.approved]: {
    text: 'Verified',
    class: 'success',
  },
};
