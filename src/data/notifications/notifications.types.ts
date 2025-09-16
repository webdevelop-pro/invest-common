import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { IProfileIndividual } from 'InvestCommon/types/api/user';
import { AccreditationTypes } from 'InvestCommon/data/accreditation/accreditation.types';

export interface INotificationToken {
  address: string;
  id: number;
  name: string;
  offer_id: number;
}

export interface INotificationDataFields {
  kyc_status?: InvestKycTypes;
  accreditation_status?: AccreditationTypes;
  funding_status?: string;
  status?: string;
  object_id?: number;
  address?: string;
  amount?: string;
  balance?: number;
  inc_balance?: number;
  out_balance?: number;
  profile?: IProfileIndividual;
  confirmed_shares?: number;
  subscribed_shares?: number;
  type: string;
  transaction_tx?: string;
  created_at?: string;
  updated_at?: string;
  investment_id?: number | null;
  network?: string;
  token?: INotificationToken;
}

interface INotificationData {
  obj: string;
  object_id: number;
  fields: INotificationDataFields;
}

export interface INotification {
  id: number;
  user_id: number;
  content: string;
  data: INotificationData;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface IFormattedNotification extends INotification {
  isNotificationInvestment: boolean;
  isNotificationDocument: boolean;
  isNotificationSystem: boolean;
  isNotificationWallet: boolean;
  isNotificationProfile: boolean;
  isNotificationUser: boolean;
  objectId: number;
  profileId: number;
  kycDeclined: boolean;
  accreditationDeclined: boolean;
  accreditationExpired: boolean;
  isStart: boolean;
  isFundsFailed: boolean;
  tagBackground: string;
  buttonText: string;
  tagText: string;
  isUnread: boolean;
  buttonTo: string;
  buttonHref: string;
}
