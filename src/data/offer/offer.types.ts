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
  isActive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isDefaultImage: boolean;
  imageBig: string;
  imageSmall: string;
  imageMedium: string;
} 