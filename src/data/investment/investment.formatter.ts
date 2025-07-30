import {
  IInvestment,
  InvestmentStatuses,
  InvestFundingStatuses,
  InvestStepTypes,
  IInvestmentFormatted,
} from './investment.types';
import { OfferFormatter } from 'InvestCommon/data/offer/offer.formatter';
import { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';

// Currency formatter function
const defaultInstance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const instance = (digits: number = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits });

function currency(val: number | undefined, digits?: number) {
  const formatter = digits !== undefined ? instance(digits) : defaultInstance;
  return val || val === 0 ? formatter.format(val) : formatter.format(0);
}

// Date formatter function
const BASE_OPTIONS = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
} as const;

const formatToFullDate = (ISOString: string): string => {
  if (!ISOString) return '-';
  return new Intl.DateTimeFormat('en-US', BASE_OPTIONS)
    .format(new Date(ISOString));
};

// Simple capitalize function since we can't import from UiKit
export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const getTimeFormat = (fullDate: string) => {
  const date = new Date(fullDate);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export class InvestmentFormatter {
  private investment: IInvestment;

  constructor(investment: IInvestment) {
    this.investment = investment;
  }

  get amountFormatted() {
    return currency(this.investment.amount);
  }

  get amountWithSign() {
    return `- ${currency(this.investment.amount, 0)}`;
  }

  get numberOfSharesFormatted() {
    return this.investment.number_of_shares.toLocaleString('en-US');
  }

  get pricePerShareFormatted() {
    return currency(this.investment.price_per_share);
  }

  get createdAtFormatted(): string {
    return this.investment.created_at
      ? formatToFullDate(new Date(this.investment.created_at).toISOString())
      : '-';
  }

  get createdAtTime(): string {
    return this.investment.created_at
      ? getTimeFormat(this.investment.created_at.toString())
      : '-';
  }

  get submitedAtFormatted(): string {
    return this.investment.submited_at
      ? formatToFullDate(new Date(this.investment.submited_at).toISOString())
      : '-';
  }

  get submitedAtTime(): string {
    return this.investment.submited_at
      ? getTimeFormat(this.investment.submited_at.toString())
      : '-';
  }

  get fundingStatusFormatted() {
    const statusMap = {
      [InvestFundingStatuses.none]: 'None',
      [InvestFundingStatuses.creation_error]: 'Creation Error',
      [InvestFundingStatuses.initialize]: 'Initialized',
      [InvestFundingStatuses.in_progress]: 'In Progress',
      [InvestFundingStatuses.received]: 'Received',
      [InvestFundingStatuses.settled]: 'Settled',
      [InvestFundingStatuses.sent_back_pending]: 'Sent Back Pending',
      [InvestFundingStatuses.sent_back_settled]: 'Sent Back Settled',
      [InvestFundingStatuses.failed]: 'Failed',
      [InvestFundingStatuses.cancelled]: 'Cancelled',
      [InvestFundingStatuses.error]: 'Error',
    };

    return statusMap[this.investment.funding_status] || 'Unknown';
  }

  get fundingTypeFormatted() {
    return this.investment.funding_type ? capitalizeFirstLetter(this.investment.funding_type) : '-';
  }

  get isFundingTypeWire() {
    return this.investment.funding_type === 'wire';
  }

  get statusFormatted() {
    const statusMap = {
      [InvestmentStatuses.confirmed]: { text: 'Confirmed', color: 'yellow-light' },
      [InvestmentStatuses.legally_confirmed]: { text: 'Legally Confirmed', color: 'secondary-light' },
      [InvestmentStatuses.successfully_closed]: { text: 'Successfully Closed', color: 'green' },
      [InvestmentStatuses.cancelled_after_investment]: { text: 'Cancelled After Investment', color: 'red' },
    };

    return {
      text: statusMap[this.investment.status]?.text || 'Unknown',
      color: statusMap[this.investment.status]?.color || 'gray',
    };
  }



  get offerFormatted() {
    if (!this.investment.offer) return undefined;

    const offerFormatter = new OfferFormatter(this.investment.offer);
    return offerFormatter.format();
  }

  get isActive() {
    return this.investment.status === InvestmentStatuses.confirmed
           || this.investment.status === InvestmentStatuses.legally_confirmed;
  }

  get isCompleted() {
    return this.investment.status === InvestmentStatuses.successfully_closed;
  }

  get isCancelled() {
    return this.investment.status === InvestmentStatuses.cancelled_after_investment;
  }

  get isPending() {
    return this.investment.funding_status === InvestFundingStatuses.in_progress
           || this.investment.funding_status === InvestFundingStatuses.initialize;
  }

  get isFundingClickable() {
    const isLeggalyConfirmed = this.investment.status === InvestmentStatuses.legally_confirmed;
    const isConfirmed = this.investment.status === InvestmentStatuses.confirmed;
    if (!this.isFundingTypeWire && !isLeggalyConfirmed) return false;
    if (this.isFundingTypeWire && !isLeggalyConfirmed && !isConfirmed) return false;
    if (!this.isFundingTypeWire && (this.investment.funding_status === InvestFundingStatuses.none)) return false;
    if (this.investment.funding_status === InvestFundingStatuses.creation_error) return false;
    if (this.investment.funding_status === InvestFundingStatuses.sent_back_pending) return false;
    if (this.investment.funding_status === InvestFundingStatuses.sent_back_settled) return false;
    return true;
  }

  format(): IInvestmentFormatted {
    return {
      ...this.investment,
      amountFormatted: this.amountFormatted,
      amountWithSign: this.amountWithSign,
      numberOfSharesFormatted: this.numberOfSharesFormatted,
      pricePerShareFormatted: this.pricePerShareFormatted,
      createdAtFormatted: this.createdAtFormatted,
      createdAtTime: this.createdAtTime,
      submitedAtFormatted: this.submitedAtFormatted,
      submitedAtTime: this.submitedAtTime,
      fundingStatusFormatted: this.fundingStatusFormatted,
      fundingTypeFormatted: this.fundingTypeFormatted,
      isFundingTypeWire: this.isFundingTypeWire,
      statusFormatted: this.statusFormatted,
      offer: this.offerFormatted || this.investment.offer as IOfferFormatted,
      isActive: this.isActive,
      isCompleted: this.isCompleted,
      isCancelled: this.isCancelled,
      isPending: this.isPending,
      isFundingClickable: this.isFundingClickable,
    };
  }
}
