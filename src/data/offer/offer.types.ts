export enum OfferStatuses {
  new = 'new',
  draft = 'draft',
  legal_review = 'legal_review',
  legal_accepted = 'legal_accepted',
  legal_declined = 'legal_declined',
  published = 'published',
  legal_closed = 'legal_closed',
  closed_successfully = 'closed_successfully',
  closed_unsuccessfully = 'closed_unsuccessfully',
}

export enum PaymentScheduleTypes {
  interest_only_monthly = 'Interest-Only Monthly',
  interest_only_quarterly = 'Interest-Only Quarterly',
  fully_amortizing_monthly = 'Fully Amortizing Monthly',
  all_at_maturity = 'All at Maturity',
  principal_at_maturity = 'Principal at Maturity',
}

export enum VotingRightsTypes {
  one_vote_per_share = '1 Vote per Share',
  no_voting_rights = 'No Voting Rights',
  other = 'Other',
}

export enum DividendType {
  none = 'None',
  cumulative = 'Cumulative',
  non_cumulative = 'Non-Cumulative',
}

export enum SecurityType {
  equity = 'Equity',
  'preferred-equity' = 'Preferred Equity',
  debt = 'Debt',
  equity_warrants = 'Equity Warrants',
  preference_shares = 'Preference Shares',
  convertible_bonds = 'Convertible Bonds',
  convertible_debt = 'Convertible Debt',
  'convertible-note' = 'Convertible Note',
}

export enum OfferDocumentsObjectTypes {
  company = 'company',
  investment_agreements = 'investment-agreements',
  tax = 'tax',
}

export interface IOfferInfoData {
  wire_to: string;
  swift_id: string;
  custodian: string;
  account_number: string;
  routing_number: string;
  apy: string;
  distribution_frequency: string;
  investment_strategy: string;
  estimated_hold_period: string;
  video?: string;
}

export interface ISecurityInfo {
  voting_rights?: string;
  liquidation_preference?: string;
  dividend_type?: string;
  cn_valuation_cap?: string;
  cn_discount_rate?: string;
  cn_interest_rate?: string;
  cn_maturity_date?: string;
  interest_rate_apy?: string;
  debt_payment_schedule?: string;
  debt_maturity_date?: string;
  debt_interest_rate?: string;
  debt_term_length?: string;
  debt_term_unit?: string;
}

export interface IOffer {
  id: number;
  name: string;
  legal_name: string;
  slug: string;
  title: string;
  security_type: string;
  price_per_share: number;
  min_investment: number;
  image_link_id: number;
  total_shares: number;
  valuation: number;
  subscribed_shares: number;
  confirmed_shares: number;
  status: string;
  approved_at: string;
  website: string;
  state: string;
  city: string;
  security_info: ISecurityInfo;
  close_at: string;
  seo_title: string;
  seo_description: string;
  description?: string;
  highlights?: string;
  additional_details: string;
  data?: IOfferInfoData;
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  telegram?: string;
  mastodon?: string;
  amount_raised: number;
}

export interface IOfferData {
  count: number;
  data: IOffer[];
}

export interface IOfferSharesError {
  number_of_shares: string[];
}

export interface IOfferComment {
  created_at: string;
  comment: string;
  related?: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

export interface IOfferCommentsResponse {
  count: number;
  data: IOfferComment[];
}

export interface IOfferCommentPayload {
  comment: string;
  related?: string;
  offer_id: number;
}


export interface IOfferFormatted extends IOffer {
  amountRaisedFormatted: string;
  pricePerShareFormatted: string;
  valuationFormatted: string;
  securityTypeFormatted: string;
  securityTypeTooltip: string | undefined;
  statusFormatted: {
    text: string;
    color: string;
  };
  approvedAtFormatted: string;
  closeAtFormatted: string;
  isDefaultImage: boolean;
  minInvestment: number;
  minInvestmentFormatted: string;
  offerFundedPercent: number;
  isClosingSoon: boolean;
  isSharesReached: boolean;
  imageBig: string;
  imageSmall: string;
  imageMedium: string;
  isNew: boolean;
  tagText: string;
  tagBackground: string;
  showTag: boolean;
  isStatusNew: boolean;
  isStatusDraft: boolean;
  isStatusLegalReview: boolean;
  isStatusLegalAccepted: boolean;
  isStatusLegalDeclined: boolean;
  isStatusPublished: boolean;
  isStatusLegalClosed: boolean;
  isStatusClosedSuccessfully: boolean;
  isStatusClosedUnsuccessfully: boolean;
  isFundingCompleted: boolean;
  // Security Info Formatted Fields
  votingRightsFormatted: string | undefined;
  liquidationPreferenceFormatted: string | undefined;
  dividendTypeFormatted: string | undefined;
  valuationCapFormatted: string | undefined;
  discountRateFormatted: string | undefined;
  interestRateFormatted: string | undefined;
  maturityDateFormatted: string | undefined;
  interestRateApyFormatted: string | undefined;
  paymentScheduleFormatted: string | undefined;
  termLengthFormatted: string | undefined;
  isSecurityTypeConvertibleNote: boolean;
  isSecurityTypeDebt: boolean;
  isSecurityTypeEquity: boolean;
  isSecurityTypePreferredEquity: boolean;
  valuationLabel: string;
} 