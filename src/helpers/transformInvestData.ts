import { IInvest } from 'InvestCommon/types/api/invest';
import { IOffer } from 'InvestCommon/types/api/offers';
import { toRaw } from 'vue';
import { IDistributionsData } from 'InvestCommon/types/api/distributions';

export const transformInvestData = (investsData: IInvest[], offersData: IOffer[]) => (
  investsData.map((investItem) => {
    const offer = offersData.find((offerItem) => offerItem.id === investItem.offer.id);
    return {
      ...investItem,
      offer,
    } as IInvest;
  })
);

export const transformDistributionsData = (data: IDistributionsData[], offersData: IInvest[]) => (
  data.map((investItem) => {
    const investment = toRaw(offersData.find((offerItem) => offerItem.id === investItem.investment_id));
    return {
      ...investItem,
      investment,
    } as IDistributionsData;
  })
);
