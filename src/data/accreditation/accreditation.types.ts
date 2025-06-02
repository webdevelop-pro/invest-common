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
}

export const AccreditationTextStatuses: Record<AccreditationTypes, ITextStatuses> = {
  [AccreditationTypes.new]: {
    text: 'Verify Accreditation',
    class: 'new',
    button: true,
  },
  [AccreditationTypes.pending]: {
    text: 'Verification In Progress',
    class: 'pending',
    tooltip: 'Please wait while our legal team will review your documents. The process may take 2-4 days. '
      + 'We will notify you automatically once we have more information.',
  },
  [AccreditationTypes.info_required]: {
    text: 'Info required',
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
