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
  valuation_cap?: string;
  discount_rate?: string;
  interest_rate?: string;
  maturity_date?: string;
  interest_rate_apy?: string;
  payment_schedule?: string;
  term_length?: number;
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
} 