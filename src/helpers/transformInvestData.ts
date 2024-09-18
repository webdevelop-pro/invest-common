import { IInvest } from 'InvestCommon/types/api/invest';
import { IOffer } from 'InvestCommon/types/api/offers';

export const transformInvestData = (investsData: IInvest[], offersData: IOffer[]) => (
  investsData.map((investItem) => {
    const offer = offersData.find((offerItem) => offerItem.id === investItem.offer.id);
    return {
      ...investItem,
      offer,
    } as IInvest;
  })
);
