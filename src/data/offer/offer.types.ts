import { IOffer } from 'InvestCommon/types/api/offers';

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
  offerFundedPercent: number;
  imageBig: string;
  imageSmall: string;
  imageMedium: string;
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