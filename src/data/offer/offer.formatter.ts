import {
  IOffer,
  OfferStatuses,
} from 'InvestCommon/types/api/offers';
import { IOfferFormatted } from './offer.types';
import defaultImage from 'InvestCommon/assets/images/default.svg?url';
import env from 'InvestCommon/global';

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

  constructor(offer: IOffer) {
    this.offer = offer;
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

  get isActive() {
    return this.offer.status === OfferStatuses.published;
  }

  get isCompleted() {
    return this.offer.status === OfferStatuses.closed_successfully;
  }

  get isCancelled() {
    return this.offer.status === OfferStatuses.closed_unsuccessfully;
  }

  getOfferImage(metaSize: 'big' | 'small' | 'medium' = 'small'): string {
    const imageID = this.offer?.image_link_id;
    if (imageID && (imageID > 0)) {
      return `${env.FILER_URL}/public/files/${imageID}?size=${metaSize}`
    }
    return defaultImage;
  }

  get isDefaultImage(): boolean {
    return !(this.offer?.image_link_id);
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
      isActive: this.isActive,
      isCompleted: this.isCompleted,
      isCancelled: this.isCancelled,
      isDefaultImage: this.isDefaultImage,
      imageBig: this.getOfferImage('big'),
      imageSmall: this.getOfferImage('small'),
      imageMedium: this.getOfferImage('medium'),
    };
  }
}
