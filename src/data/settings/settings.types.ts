export { ISession, IAuthFlow, ILogoutFlow } from '../auth/auth.type';

export interface IActivityRow {
  date: string;
  time: string;
  ip: string;
  browser: string;
  id: string;
  current?: boolean;
}

export type ISessionDevice = import('../auth/auth.type').ISession['devices'][number];

import { ISession } from '../auth/auth.type';
export interface ISessionFormatted extends ISession {
  authenticatedAtDate: string;
  authenticatedAtTime: string;
  devicesFormatted: IActivityRow[];
};


