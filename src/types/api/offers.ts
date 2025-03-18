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

export interface IOfferDocuments {
  id: number;
  url: string;
  name: string;
  filename: string;
  mime: string;
  bucket_path: string;
  updated_at: string;
  type: string;
  meta_data: {
    big: string;
    small: string;
    medium: string;
    size: number;
  };
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

export interface IOffer {
  id: number;
  amount_raised: number;
  approved_at: string;
  close_at: string;
  confirmed_shares: number;
  image: {
    bucket_path: string;
    filename: string;
    id: number;
    meta_data: {
      big: string;
      small: string;
      medium: string;
      size: number;
    };
    name: string;
    updated_at: string;
    url: string;
  };
  min_investment: number;
  name: string;
  legal_name: string;
  price_per_share: number;
  seo_description: string;
  seo_title: string;
  slug: string;
  description?: string;
  highlights?: string;
  status: string;
  subscribed_shares: number;
  title: string;
  total_shares: number;
  valuation: number;
  documents: IOfferDocuments[];
  website: string;
  security_type: string;
  city: string;
  state: string;
  data?: IOfferInfoData;
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
