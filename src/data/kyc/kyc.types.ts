export enum InvestKycTypes {
  none = 'none',
  new = 'new',
  pending = 'pending',
  approved = 'approved',
  declined = 'declined',
  in_progress = 'in_progress',
}

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
  status: InvestKycTypes;
}

export interface IKycProfile {
  id: number;
  user_id: number;
  kyc_status: InvestKycTypes;
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

interface IAlerts {
  title: string;
  class: string;
  button?: boolean;
  tooltip?: string;
  description?: string;
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

export const KycAlerts: Record<InvestKycTypes, IAlerts> = {
  [InvestKycTypes.none]: {
    title: 'Verify Identity',
    description: 'Complete identity verification to unlock investing access for this profile.',
    class: 'none',
    button: true,
  },
  [InvestKycTypes.new]: {
    title: 'Verify Identity',
    description: 'Complete identity verification to unlock investing access for this profile.',
    class: 'none',
    button: true,
  },
  [InvestKycTypes.pending]: {
    title: 'Finish Your KYC',
    description: 'Complete the remaining identity verification steps so we can continue reviewing your submission.',
    class: 'pending',
    button: true,
  },
  [InvestKycTypes.in_progress]: {
    title: 'Verification In Progress',
    description: 'Your KYC review is in progress. We will notify you as soon as there is an update.',
    class: 'pending',
  },
  [InvestKycTypes.declined]: {
    title: 'Verification Declined',
    description: 'Your identity verification was declined. <a href="#contact-us-dialog" class="is--link-1" data-action="contact-us">Contact support</a> and we will help resolve the issue.',
    class: 'failed',
  },
  [InvestKycTypes.approved]: {
    title: 'Identity Verified',
    description: 'Your identity has been successfully verified for this investment profile.',
    class: 'success',
  },
};
