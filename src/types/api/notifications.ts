import { AccreditationTypes, InvestKycTypes } from './invest';
import { IProfileIndividual } from './user';

export interface INotification {
  id: number;
  user_id: number;
  content: string;
  data: {
    obj: string;
    id: number;
    fields: {
      kyc_status?: InvestKycTypes;
      accreditation_status?: AccreditationTypes;
      funding_status?: string;
      status?: string;
      object_id?: number;
      balance?: number;
      inc_balance?: number;
      out_balance?: number;
      profile?: IProfileIndividual;
      confirmed_shares?: number;
      subscribed_shares?: number;
    };
  };
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
}
