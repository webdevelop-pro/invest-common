
import { AccreditationTypes, InvestFundingStatuses, InvestKycTypes } from 'InvestCommon/types/api/invest';

export const STEP_ONE = 'STEP_ONE';

export const STEP_TWO = 'STEP_TWO';

export const STEP_THREE = 'STEP_THREE';

interface IFundingTextStatus {
    text: string;
    tooltip?: string;
}

export const InvestTransactionStatuses: Record<InvestFundingStatuses, IFundingTextStatus> = {
    [InvestFundingStatuses.none]: {
      text: 'None',
    },
    [InvestFundingStatuses.creation_error]: {
      text: '-',
    },
    [InvestFundingStatuses.initialize]: {
      text: 'Pending',
    },
    [InvestFundingStatuses.in_progress]: {
      text: 'Pending',
    },
    [InvestFundingStatuses.received]: {
      text: 'Processed',
    },
    [InvestFundingStatuses.settled]: {
      text: 'Processed',
    },
    [InvestFundingStatuses.sent_back_pending]: {
      text: '-',
    },
    [InvestFundingStatuses.sent_back_settled]: {
      text: '-',
    },
    [InvestFundingStatuses.failed]: {
      text: 'Failed',
    },
    [InvestFundingStatuses.cancelled]: {
      text: 'Canceled',
    },
    [InvestFundingStatuses.error]: {
      text: 'Error',
    },
  };