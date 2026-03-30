export enum AccreditationTypes {
  new = 'new',
  pending = 'pending',
  info_required = 'info_required',
  expired = 'expired',
  approved = 'approved',
  declined = 'declined'
}

export interface ITextStatuses {
  text: string;
  class: string;
  button?: boolean;
  tooltip?: string;
  mobileText?: string;
}

export interface IAlerts {
  title: string;
  class: string;
  button?: boolean;
  tooltip?: string;
  description?: string;
}

export interface IAccreditationData {
  completed_at: string;
  created_at: string;
  status: AccreditationTypes;
  notes?: string;
}

export interface IAccreditation {
  accreditation_data: IAccreditationData[];
  accreditation_status: AccreditationTypes;
}

export const AccreditationTextStatuses: Record<AccreditationTypes, ITextStatuses> = {
  [AccreditationTypes.new]: {
    text: 'Verify Accreditation',
    mobileText: 'Verify',
    class: 'new',
    button: true,
  },
  [AccreditationTypes.pending]: {
    text: 'Verification In Progress',
    mobileText: 'In Progress',
    class: 'pending',
    tooltip: 'Please wait while our legal team will review your documents. The process may take 2-4 days. '
      + 'We will notify you automatically once we have more information.',
  },
  [AccreditationTypes.info_required]: {
    text: 'Info required',
    mobileText: 'Need Info',
    class: 'info-required',
    button: true,
  },
  [AccreditationTypes.expired]: {
    text: 'Expired',
    class: 'expired',
    button: true,
  },
  [AccreditationTypes.approved]: {
    text: 'Verified',
    class: 'success',
  },
  [AccreditationTypes.declined]: {
    text: 'Failed',
    class: 'failed',
    button: true,
  },
};

export const AccreditationAlerts: Record<AccreditationTypes, IAlerts> = {
  [AccreditationTypes.new]: {
    title: 'Verify Accreditation',
    description: 'Complete your accreditation verification to unlock investment eligibility for this profile.',
    class: 'new',
    button: true,
  },
  [AccreditationTypes.pending]: {
    title: 'Verification In Progress',
    description: 'Please wait while our legal team will review your documents. The process may take 2-4 days. '
      + 'We will notify you automatically once we have more information.',
    class: 'pending',
  },
  [AccreditationTypes.info_required]: {
    title: 'Info required',
    description: 'Please provide the additional accreditation information requested by our verification team.',
    class: 'info-required',
    button: true,
  },
  [AccreditationTypes.expired]: {
    title: 'Expired',
    description: 'Your accreditation has expired. Please upload updated documents to continue investing.',
    class: 'expired',
    button: true,
  },
  [AccreditationTypes.approved]: {
    title: 'Verified',
    description: 'Your accreditation has been approved and is active for this investment profile.',
    class: 'success',
  },
  [AccreditationTypes.declined]: {
    title: 'Failed',
    description: 'Your accreditation could not be verified. Please resubmit your documents to continue.',
    class: 'failed',
    button: true,
  },
};
