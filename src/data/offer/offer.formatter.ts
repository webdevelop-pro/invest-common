import defaultImage from 'InvestCommon/shared/assets/images/default.svg?url';
import env from 'InvestCommon/domain/config/env';
import {
  IOfferFormatted, IOffer, OfferStatuses, PaymentScheduleTypes, VotingRightsTypes,
  DividendType, DividendFrequencyTypes,
} from './offer.types';

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

  get securityTypeTooltip(): string | undefined {
    const securityTypeTooltips: Record<string, string> = {
      'debt': 'A loan to the company that must be repaid with interest. Investors receive fixed interest payments on a set schedule until maturity.',
      'convertible-note': 'A loan that may convert into equity (shares) in the future, usually during a financing round and often at a discount or with other benefits.',
      'equity': 'Ownership shares in the company. Common stock may include voting rights, limited voting rights, or none, depending on the terms. Holders share in profits (if dividends are declared) and potential exit upside, but are last in priority if the company liquidates.',
      'preferred-equity': 'Shares with priority over common stock for dividends and liquidation proceeds. Preferred stock may or may not include voting rights, depending on the terms.',
    };

    return this.offer.security_type ? securityTypeTooltips[this.offer.security_type.toLowerCase()] : undefined;
  }

  get isSecurityTypeConvertibleNote(): boolean {
    return this.offer.security_type === 'convertible-note';
  }

  get isSecurityTypeDebt(): boolean {
    return this.offer.security_type === 'debt';
  }

  get isSecurityTypeEquity(): boolean {
    return this.offer.security_type === 'equity';
  }

  get isSecurityTypePreferredEquity(): boolean {
    return this.offer.security_type === 'preferred-equity';
  }

  get valuationLabel(): string {
    if (this.isSecurityTypeDebt || this.isSecurityTypeConvertibleNote) {
      return 'Funding Goal:';
    }
    return 'Pre-Money Valuation:';
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

  get isFullyFunded(): boolean {
    return this.offerFundedPercent >= 100;
  }

  get isClosingSoon(): boolean {
    return this.offerFundedPercent > 90 && !this.isFullyFunded;
  }

  get isSharesReached(): boolean {
    return (this.offer.total_shares - this.offer.subscribed_shares) < this.offer.min_investment;
  }

  get isDefaultImage(): boolean {
    return !(this.offer?.image_link_id);
  }

  get minInvestment(): number {
    const minShares = this.offer.min_investment || 0;
    const pricePerShare = this.offer.price_per_share || 0;
    return minShares * pricePerShare;
  }

  get minInvestmentFormatted(): string {
    return currency(this.minInvestment, 0);
  }

  get isNew(): boolean {
    const approvedAt = this.offer.approved_at;
    if (!approvedAt) return false;
    const approvedDate = new Date(approvedAt);
    const now = new Date();
    const diffMs = now.getTime() - approvedDate.getTime();
    const diffDays = diffMs / (1000 * 3600 * 24);
    return diffDays < 2;
  }

  get tagText(): string {
    if (this.isFullyFunded) return 'Funded';
    if (this.isClosingSoon) return '🔥 Closing Soon';
    return 'New';
  }

  get tagBackground(): string {
    if (this.isFullyFunded) return 'is--background-secondary-light';
    if (this.isClosingSoon) return 'is--background-yellow-light';
    return 'is--background-secondary-light';
  }

  get showTag(): boolean {
    return this.isFullyFunded || this.isClosingSoon || this.isNew;
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

  // Security Info Formatters
  get votingRightsFormatted(): string | undefined {
    const votingRights = this.offer.security_info?.voting_rights;
    if (!votingRights) return undefined;
    
    return VotingRightsTypes[votingRights as keyof typeof VotingRightsTypes] || votingRights;
  }

  get liquidationPreferenceFormatted(): string | undefined {
    if (this.isSecurityTypeEquity) return undefined;
    return this.offer.security_info?.liquidation_preference;
  }

  get dividendTypeFormatted(): string | undefined {
    const dividendType = this.offer.security_info?.dividend_type;
    if (!dividendType || this.isSecurityTypeEquity) return undefined;
    
    return DividendType[dividendType as keyof typeof DividendType] || dividendType;
  }

  get dividendRateFormatted(): string | undefined {
    const dividendRate = this.offer.security_info?.dividend_rate;
    if (!dividendRate) return undefined;
    
    // Convert to string to handle both string and number types
    const dividendRateStr = String(dividendRate);
    if (dividendRateStr.toLowerCase() === 'none' || dividendRateStr.toLowerCase() === '') return undefined;

    const numericValue = parseFloat(dividendRateStr);
    if (Number.isNaN(numericValue)) return dividendRateStr;

    return `${numericValue}%`;
  }

  get dividendPaymentFrequencyFormatted(): string | undefined {
    const frequency = this.offer.security_info?.dividend_payment_frequency;
    if (!frequency) return undefined;

    return DividendFrequencyTypes[frequency as keyof typeof DividendFrequencyTypes] || frequency;
  }

  get valuationCapFormatted(): string | undefined {
    const valuationCap = this.offer.security_info?.cn_valuation_cap;
    if (!valuationCap) return undefined;
    
    // Parse the value and format as currency
    const numericValue = parseFloat(valuationCap);
    if (isNaN(numericValue)) return valuationCap; // Return as-is if not a number
    
    return currency(numericValue);
  }

  get discountRateFormatted(): string | undefined {
    const discountRate = this.offer.security_info?.cn_discount_rate;
    if (!discountRate) return undefined;
    
    // Parse the value and format as percentage
    const numericValue = parseFloat(discountRate);
    if (isNaN(numericValue)) return discountRate; // Return as-is if not a number
    
    return `${numericValue}%`;
  }

  get interestRateFormatted(): string | undefined {
    const cnInterestRate = this.offer.security_info?.cn_interest_rate;
    const debtInterestRate = this.offer.security_info?.debt_interest_rate;
    
    const rate = cnInterestRate || debtInterestRate;
    if (!rate) return undefined;
    
    // Parse the value and format as percentage
    const numericValue = parseFloat(rate);
    if (isNaN(numericValue)) return rate; // Return as-is if not a number
    
    return `${numericValue}%`;
  }

  get maturityDateFormatted(): string | undefined {
    const cnMaturityDate = this.offer.security_info?.cn_maturity_date;
    const debtMaturityDate = this.offer.security_info?.debt_maturity_date;
    
    if (cnMaturityDate) {
      return formatToFullDate(new Date(cnMaturityDate).toISOString());
    }
    
    if (debtMaturityDate) {
      return formatToFullDate(new Date(debtMaturityDate).toISOString());
    }
    
    return undefined;
  }

  get interestRateApyFormatted(): string | undefined {
    const interestRateApy = this.offer.security_info?.interest_rate_apy;
    if (!interestRateApy) return undefined;
    
    // Parse the value and format as percentage
    const numericValue = parseFloat(interestRateApy);
    if (isNaN(numericValue)) return interestRateApy; // Return as-is if not a number
    
    return `${numericValue}%`;
  }

  get paymentScheduleFormatted(): string | undefined {
    const paymentSchedule = this.offer.security_info?.debt_payment_schedule;
    if (!paymentSchedule) return undefined;
    
    return PaymentScheduleTypes[paymentSchedule as keyof typeof PaymentScheduleTypes] || paymentSchedule;
  }

  get termLengthFormatted(): string | undefined {
    const termLength = this.offer.security_info?.debt_term_length;
    const termUnit = this.offer.security_info?.debt_term_unit;
    
    if (!termLength) return undefined;
    
    return `${termLength} ${termUnit}`;
  }

  private createDefaultOffer(): IOffer {
    return {
      id: 0,
      amount_raised: 0,
      approved_at: '',
      close_at: '',
      confirmed_shares: 0,
      image_link_id: 0,
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
      additional_details: '',
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
      security_info: {
        voting_rights: '',
        liquidation_preference: '',
        dividend_type: '',
        dividend_rate: '',
        dividend_payment_frequency: '',
        cn_valuation_cap: '',
        cn_discount_rate: '',
        cn_interest_rate: '',
        cn_maturity_date: '',
        interest_rate_apy: '',
        debt_payment_schedule: '',
        debt_maturity_date: '',
        debt_interest_rate: '',
        debt_term_length: '',
        debt_term_unit: '',
      },
      linkedin: '',
      facebook: '',
      twitter: '',
      github: '',
      instagram: '',
      telegram: '',
      mastodon: '',
    };
  }

  format(): IOfferFormatted {
    return {
      ...this.offer,
      amountRaisedFormatted: this.amountRaisedFormatted,
      pricePerShareFormatted: this.pricePerShareFormatted,
      valuationFormatted: this.valuationFormatted,
      securityTypeFormatted: this.securityTypeFormatted,
      securityTypeTooltip: this.securityTypeTooltip,
      statusFormatted: this.statusFormatted,
      approvedAtFormatted: this.approvedAtFormatted,
      closeAtFormatted: this.closeAtFormatted,
      isDefaultImage: this.isDefaultImage,
      minInvestment: this.minInvestment,
      minInvestmentFormatted: this.minInvestmentFormatted,
      offerFundedPercent: this.offerFundedPercent,
      isClosingSoon: this.isClosingSoon,
      isSharesReached: this.isSharesReached,
      imageBig: this.getOfferImage('big'),
      imageSmall: this.getOfferImage('small'),
      imageMedium: this.getOfferImage('medium'),
      tagText: this.tagText,
      tagBackground: this.tagBackground,
      showTag: this.showTag,
      isNew: this.isNew,
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
      // Security Info Formatted Fields
      votingRightsFormatted: this.votingRightsFormatted,
      liquidationPreferenceFormatted: this.liquidationPreferenceFormatted,
      dividendTypeFormatted: this.dividendTypeFormatted,
      dividendRateFormatted: this.dividendRateFormatted,
      dividendPaymentFrequencyFormatted: this.dividendPaymentFrequencyFormatted,
      valuationCapFormatted: this.valuationCapFormatted,
      discountRateFormatted: this.discountRateFormatted,
      interestRateFormatted: this.interestRateFormatted,
      maturityDateFormatted: this.maturityDateFormatted,
      interestRateApyFormatted: this.interestRateApyFormatted,
      paymentScheduleFormatted: this.paymentScheduleFormatted,
      termLengthFormatted: this.termLengthFormatted,
      isSecurityTypeConvertibleNote: this.isSecurityTypeConvertibleNote,
      isSecurityTypeDebt: this.isSecurityTypeDebt,
      isSecurityTypeEquity: this.isSecurityTypeEquity,
      isSecurityTypePreferredEquity: this.isSecurityTypePreferredEquity,
      valuationLabel: this.valuationLabel,
    };
  }
}
