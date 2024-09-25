import { IInvest, InvestFundingStatuses, InvestmentStatuses } from 'InvestCommon/types/api/invest';
import defaultImage from 'InvestCommon/assets/images/default.svg?url';

export const getInvestmentTagBackground = (status: string | undefined): string => {
  if (status === 'legally_confirmed') return '#D9FFEE';
  if (status === 'failed') return '#FF7070';
  return '#FFF7E8';
};

export const InvestmentStatusesFormated: Record<InvestmentStatuses, { text: string }> = {
  [InvestmentStatuses.confirmed]: {
    text: 'Confirmed',
  },
  [InvestmentStatuses.cancelled_after_investment]: {
    text: 'Cancellation Requested',
  },
  [InvestmentStatuses.legally_confirmed]: {
    text: 'Legally Confirmed',
  },
  [InvestmentStatuses.successfully_closed]: {
    text: 'Successfully Closed',
  },
};

export const getInvestmentStatusFormated = (status: InvestmentStatuses | undefined): string | undefined => {
  if (status && InvestmentStatusesFormated[status]) return InvestmentStatusesFormated[status].text;
  return status;
};

export const isInvestmentFundingClickable = (invesment: IInvest | null): boolean => {
  const isLeggalyConfirmed = invesment?.status === InvestmentStatuses.legally_confirmed;
  const isConfirmed = invesment?.status === InvestmentStatuses.confirmed;
  const isWire = invesment?.funding_type === 'wire';
  if (!isWire && !isLeggalyConfirmed) return false;
  if (isWire && !isLeggalyConfirmed && !isConfirmed) return false;
  if (!isWire && (invesment?.funding_status === InvestFundingStatuses.none)) return false;
  if (invesment?.funding_status === InvestFundingStatuses.creation_error) return false;
  if (invesment?.funding_status === InvestFundingStatuses.sent_back_pending) return false;
  if (invesment?.funding_status === InvestFundingStatuses.sent_back_settled) return false;
  return true;
};

export const getInvestmentOfferImage = (
  investment: IInvest | null,
  metaSize: 'big' | 'small' | 'medium' = 'small',
): string => {
  if (investment?.offer?.image?.meta_data && investment?.offer?.image?.meta_data[metaSize]) {
    return investment.offer.image.meta_data[metaSize];
  }
  if (investment?.offer?.image?.url) {
    return investment.offer.image.url;
  }
  return defaultImage;
};

export const getDistributionTagBackground = (status: string | undefined): string => {
  if (status === 'success') return '#D9FFEE';
  if (status === 'failed') return '#FF7070';
  return '#FFF7E8';
};
