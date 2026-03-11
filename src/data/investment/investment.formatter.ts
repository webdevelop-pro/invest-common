import {
  IInvestment,
  InvestmentStatuses,
  InvestFundingStatuses,
  IInvestmentFormatted,
  InvestStepTypes,
  FundingTypes,
} from './investment.types';
import { OfferFormatter } from 'InvestCommon/data/offer/offer.formatter';
import { IOffer } from 'InvestCommon/data/offer/offer.types';
import defaultImage from 'InvestCommon/shared/assets/images/default.svg?url';

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

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', BASE_OPTIONS);

const formatToFullDate = (value: string | Date): string => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return DATE_FORMATTER.format(date);
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
  private investment: IInvestment | null;

  constructor(investment?: IInvestment) {
    this.investment = investment ?? this.createDefaultInvestment();
  }

  get amountFormatted() {
    return currency(this.investment?.amount);
  }

  get amountFormattedZero() {
    return currency(this.investment?.amount, 0);
  }

  get amountWithSign() {
    return `- ${currency(this.investment?.amount, 0)}`;
  }

  get numberOfSharesFormatted() {
    return this.investment?.number_of_shares?.toLocaleString('en-US') || '0';
  }

  get pricePerShareFormatted() {
    return currency(this.investment?.price_per_share);
  }

  get createdAtFormatted(): string {
    return this.investment?.created_at
      ? formatToFullDate(this.investment.created_at)
      : '-';
  }

  get createdAtTime(): string {
    return this.investment?.created_at
      ? getTimeFormat(this.investment.created_at.toString())
      : '-';
  }

  get submitedAtFormatted(): string {
    return this.investment?.submited_at
      ? formatToFullDate(this.investment.submited_at)
      : '-';
  }

  get submitedAtTime(): string {
    return this.investment?.submited_at
      ? getTimeFormat(this.investment.submited_at.toString())
      : '-';
  }

  get paymentDataCreatedAtFormatted(): string {
    return this.investment?.payment_data?.created_at
      ? formatToFullDate(this.investment.payment_data.created_at)
      : '-';
  }

  get paymentDataCreatedAtTime(): string {
    return this.investment?.payment_data?.created_at
      ? getTimeFormat(this.investment.payment_data.created_at.toString())
      : '-';
  }

  get paymentDataUpdatedAtFormatted(): string {
    return this.investment?.payment_data?.updated_at
      ? formatToFullDate(this.investment.payment_data.updated_at)
      : '-';
  }

  get paymentDataUpdatedAtTime(): string {
    return this.investment?.payment_data?.updated_at
      ? getTimeFormat(this.investment.payment_data.updated_at.toString())
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

    return statusMap[this.investment?.funding_status as InvestFundingStatuses] || 'N/A';
  }

  get fundingTypeFormatted() {
    return this.investment?.funding_type ? capitalizeFirstLetter(this.investment.funding_type) : '-';
  }

  get isFundingTypeWire() {
    return this.investment?.funding_type === FundingTypes.wire;
  }

  get statusFormatted() {
    const statusMap = {
      [InvestmentStatuses.confirmed]: { text: 'Confirmed', color: 'yellow-light' },
      [InvestmentStatuses.legally_confirmed]: { text: 'Legally Confirmed', color: 'secondary-light' },
      [InvestmentStatuses.successfully_closed]: { text: 'Successfully Closed', color: 'green' },
      [InvestmentStatuses.cancelled_after_investment]: { text: 'Cancelled After Investment', color: 'red' },
    };

    return {
      text: statusMap[this.investment?.status as InvestmentStatuses]?.text || 'N/A',
      color: statusMap[this.investment?.status as InvestmentStatuses]?.color || 'gray',
    };
  }
  get isActive() {
    return this.investment?.status === InvestmentStatuses.confirmed
           || this.investment?.status === InvestmentStatuses.legally_confirmed;
  }

  get isCompleted() {
    return this.investment?.status === InvestmentStatuses.successfully_closed;
  }

  get isCancelled() {
    return this.investment?.status === InvestmentStatuses.cancelled_after_investment;
  }

  get isPending() {
    return this.investment?.funding_status === InvestFundingStatuses.in_progress
           || this.investment?.funding_status === InvestFundingStatuses.initialize;
  }

  get isFundingClickable() {
    const isLeggalyConfirmed = this.investment?.status === InvestmentStatuses.legally_confirmed;
    const isConfirmed = this.investment?.status === InvestmentStatuses.confirmed;
    if (!this.isFundingTypeWire && !isLeggalyConfirmed) return false;
    if (this.isFundingTypeWire && !isLeggalyConfirmed && !isConfirmed) return false;
    if (!this.isFundingTypeWire && (this.investment?.funding_status === InvestFundingStatuses.none)) return false;
    if (this.investment?.funding_status === InvestFundingStatuses.creation_error) return false;
    if (this.investment?.funding_status === InvestFundingStatuses.sent_back_pending) return false;
    if (this.investment?.funding_status === InvestFundingStatuses.sent_back_settled) return false;
    return true;
  }

  private createDefaultInvestment(): IInvestment {
    return {
      closed_at: new Date(),
      id: 0,
      offer: {} as IOffer, // Will be handled by OfferFormatter
      profile_id: 0,
      user_id: 0,
      price_per_share: 0,
      number_of_shares: 0,
      amount: 0,
      step: InvestStepTypes.amount,
      status: InvestmentStatuses.confirmed,
      created_at: new Date(),
      submited_at: new Date(),
      funding_type: FundingTypes.wire,
      funding_status: InvestFundingStatuses.none,
      signature_data: {
        created_at: '',
        signature_id: '',
        entity_id: '',
        provider: '',
        ip_address: '',
        user_browser: '',
        signed_by_investor: false,
      },
      escrow_data: {
        pr_name: '',
        transaction_id: '',
        pr_approval_date: '',
        pr_approval_status: '',
      },
      payment_data: {
        account_type: '',
        account_number: '',
        routing_number: '',
        account_holder_name: '',
        transaction_id: '',
      },
      payment_type: '',
      escrow_type: '',
      entity_id: '',
      transaction_ref: '',
      notes: undefined,
    };
  }

  format(): IInvestmentFormatted {
    const offerFormatted = new OfferFormatter(this.investment?.offer).format();

    return {
      ...this.investment!,
      offer: offerFormatted,
      amountFormatted: this.amountFormatted,
      amountFormattedZero: this.amountFormattedZero,
      amountWithSign: this.amountWithSign,
      numberOfSharesFormatted: this.numberOfSharesFormatted,
      pricePerShareFormatted: this.pricePerShareFormatted,
      createdAtFormatted: this.createdAtFormatted,
      createdAtTime: this.createdAtTime,
      submitedAtFormatted: this.submitedAtFormatted,
      submitedAtTime: this.submitedAtTime,
      paymentDataCreatedAtFormatted: this.paymentDataCreatedAtFormatted,
      paymentDataCreatedAtTime: this.paymentDataCreatedAtTime,
      paymentDataUpdatedAtFormatted: this.paymentDataUpdatedAtFormatted,
      paymentDataUpdatedAtTime: this.paymentDataUpdatedAtTime,
      fundingStatusFormatted: this.fundingStatusFormatted,
      fundingTypeFormatted: this.fundingTypeFormatted,
      isFundingTypeWire: this.isFundingTypeWire,
      statusFormatted: this.statusFormatted,
      isActive: this.isActive,
      isCompleted: this.isCompleted,
      isCancelled: this.isCancelled,
      isPending: this.isPending,
      isFundingClickable: this.isFundingClickable,
    } as IInvestmentFormatted;
  }
}

export function getInvestmentOfferImage(
  investment: IInvestment | IInvestmentFormatted | null,
  metaSize: 'big' | 'small' | 'medium' = 'small',
): string {
  // The investment's embedded offer may contain additional image metadata
  // that isn't represented in the shared IOffer type, so we treat it as `any`.
  const offer: any = (investment as any)?.offer;

  // Prefer explicit meta_data / url from the API when present
  if (offer?.image?.meta_data && offer.image.meta_data[metaSize]) {
    return offer.image.meta_data[metaSize];
  }

  if (offer?.image?.url) {
    return offer.image.url;
  }

  // Fallback to OfferFormatter logic (uses FILER_URL + image_link_id)
  if (offer) {
    const formatter = new OfferFormatter(offer);
    return formatter.getOfferImage(metaSize);
  }

  // Final safety fallback
  return defaultImage;
}
