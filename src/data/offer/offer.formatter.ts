import {
  IOffer,
  OfferStatuses,
} from 'InvestCommon/types/api/offers';
import defaultImage from 'InvestCommon/assets/images/default.svg?url';
import env from 'InvestCommon/global';
import { IOfferFormatted } from './offer.types';

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
const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export class OfferFormatter {
  private offer: IOffer;

  constructor(offer?: IOffer) {
    this.offer = offer || this.createDefaultOffer();
  }

  get amountRaisedFormatted() {
    return currency(this.offer.amount_raised);
  }

  get pricePerShareFormatted() {
    return currency(this.offer.price_per_share);
  }

  get valuationFormatted() {
    return this.offer.valuation ? currency(this.offer.valuation) : '-';
  }

  get securityTypeFormatted() {
    return this.offer.security_type ? capitalizeFirstLetter(this.offer.security_type) : '-';
  }

  get approvedAtFormatted(): string {
    return this.offer.approved_at
      ? formatToFullDate(new Date(this.offer.approved_at).toISOString())
      : '-';
  }

  get closeAtFormatted(): string {
    return this.offer.close_at
      ? formatToFullDate(new Date(this.offer.close_at).toISOString())
      : 'not closed';
  }

  get statusFormatted() {
    const statusMap = {
      [OfferStatuses.new]: { text: 'New', color: 'blue' },
      [OfferStatuses.draft]: { text: 'Draft', color: 'gray' },
      [OfferStatuses.legal_review]: { text: 'Legal Review', color: 'yellow' },
      [OfferStatuses.legal_accepted]: { text: 'Legal Accepted', color: 'green' },
      [OfferStatuses.legal_declined]: { text: 'Legal Declined', color: 'red' },
      [OfferStatuses.published]: { text: 'Published', color: 'green' },
      [OfferStatuses.legal_closed]: { text: 'Legal Closed', color: 'orange' },
      [OfferStatuses.closed_successfully]: { text: 'Closed Successfully', color: 'green' },
      [OfferStatuses.closed_unsuccessfully]: { text: 'Closed Unsuccessfully', color: 'red' },
    };

    return {
      text: statusMap[this.offer.status as OfferStatuses]?.text || 'Unknown',
      color: statusMap[this.offer.status as OfferStatuses]?.color || 'gray',
    };
  }

  getOfferImage(metaSize: 'big' | 'small' | 'medium' = 'small'): string {
    const imageID = this.offer?.image_link_id;
    if (imageID && (imageID > 0)) {
      return `${env.FILER_URL}/public/files/${imageID}?size=${metaSize}`;
    }
    return defaultImage;
  }

  get offerFundedPercent() {
    if (!this.offer.total_shares || this.offer.total_shares === 0) {
      return 0;
    }

    const percent = (this.offer.subscribed_shares / this.offer.total_shares) * 100;

    // For high percentages (>85%), use floor to avoid showing 100% prematurely
    if (percent > 85) {
      return Math.floor(percent);
    }

    // For lower percentages, use ceil to show progress
    return Math.ceil(percent);
  }

  get isClosingSoon(): boolean {
    return this.offerFundedPercent > 90;
  }

  get isDefaultImage(): boolean {
    return !(this.offer?.image_link_id);
  }

  get isStatusNew(): boolean {
    return this.offer.status === OfferStatuses.new;
  }

  get isStatusDraft(): boolean {
    return this.offer.status === OfferStatuses.draft;
  }

  get isStatusLegalReview(): boolean {
    return this.offer.status === OfferStatuses.legal_review;
  }

  get isStatusLegalAccepted(): boolean {
    return this.offer.status === OfferStatuses.legal_accepted;
  }

  get isStatusLegalDeclined(): boolean {
    return this.offer.status === OfferStatuses.legal_declined;
  }

  get isStatusPublished(): boolean {
    return this.offer.status === OfferStatuses.published;
  }

  get isStatusLegalClosed(): boolean {
    return this.offer.status === OfferStatuses.legal_closed;
  }

  get isStatusClosedSuccessfully(): boolean {
    return this.offer.status === OfferStatuses.closed_successfully;
  }

  get isStatusClosedUnsuccessfully(): boolean {
    return this.offer.status === OfferStatuses.closed_unsuccessfully;
  }

  get isFundingCompleted(): boolean {
    return (
      this.offer.status === OfferStatuses.legal_closed
      || this.offer.status === OfferStatuses.closed_successfully
      || this.offer.status === OfferStatuses.closed_unsuccessfully
    );
  }

  private createDefaultOffer(): IOffer {
    return {
      id: 0,
      amount_raised: 0,
      approved_at: '',
      close_at: '',
      confirmed_shares: 0,
      image: {
        bucket_path: '',
        filename: '',
        id: 0,
        meta_data: {
          big: '',
          small: '',
          medium: '',
          size: 0,
        },
        name: '',
        updated_at: '',
        url: '',
      },
      min_investment: 0,
      name: '',
      legal_name: '',
      price_per_share: 0,
      seo_description: '',
      seo_title: '',
      slug: '',
      description: '',
      highlights: '',
      status: 'draft',
      subscribed_shares: 0,
      title: '',
      total_shares: 0,
      valuation: 0,
      documents: [],
      website: '',
      security_type: '',
      city: '',
      state: '',
      data: {
        wire_to: '',
        swift_id: '',
        custodian: '',
        account_number: '',
        routing_number: '',
        apy: '',
        distribution_frequency: '',
        investment_strategy: '',
        estimated_hold_period: '',
      },
    };
  }

  format(): IOfferFormatted {
    return {
      ...this.offer,
      amountRaisedFormatted: this.amountRaisedFormatted,
      pricePerShareFormatted: this.pricePerShareFormatted,
      valuationFormatted: this.valuationFormatted,
      securityTypeFormatted: this.securityTypeFormatted,
      statusFormatted: this.statusFormatted,
      approvedAtFormatted: this.approvedAtFormatted,
      closeAtFormatted: this.closeAtFormatted,
      isDefaultImage: this.isDefaultImage,
      offerFundedPercent: this.offerFundedPercent,
      isClosingSoon: this.isClosingSoon,
      imageBig: this.getOfferImage('big'),
      imageSmall: this.getOfferImage('small'),
      imageMedium: this.getOfferImage('medium'),
      isStatusNew: this.isStatusNew,
      isStatusDraft: this.isStatusDraft,
      isStatusLegalReview: this.isStatusLegalReview,
      isStatusLegalAccepted: this.isStatusLegalAccepted,
      isStatusLegalDeclined: this.isStatusLegalDeclined,
      isStatusPublished: this.isStatusPublished,
      isStatusLegalClosed: this.isStatusLegalClosed,
      isStatusClosedSuccessfully: this.isStatusClosedSuccessfully,
      isStatusClosedUnsuccessfully: this.isStatusClosedUnsuccessfully,
      isFundingCompleted: this.isFundingCompleted,
    };
  }
}
