import { ISession } from '../auth/auth.type';
import { IActivityRow, ISessionFormatted } from './settings.types';

const BASE_OPTIONS = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
} as const;

const HOURS_OPTIONS = {
  ...BASE_OPTIONS,
  hour: 'numeric',
  minute: 'numeric',
} as const;

export const formatToDate = (ISOString: string, withHours = false) => (
  new Intl.DateTimeFormat('en-US', withHours ? HOURS_OPTIONS : BASE_OPTIONS)
    .format(new Date(ISOString))
);

export class SessionFormatter {
  private session: ISession;

  constructor(session: ISession) {
    this.session = session;
  }

  get authenticatedAtDate(): string {
    return this.session?.authenticated_at ? formatToDate(this.session.authenticated_at) : '';
  }

  get authenticatedAtTime(): string {
    return this.session?.authenticated_at ? this.getTimeFormat(this.session.authenticated_at) : '';
  }

  private formatDevices(): IActivityRow[] {
    return (this.session?.devices || []).map((device) => ({
      date: this.authenticatedAtDate,
      time: this.authenticatedAtTime,
      ip: device?.ip_address,
      browser: device?.user_agent,
      id: this.session?.id,
    }));
  }

  private getTimeFormat(fullDate: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' })
        .format(new Date(fullDate));
    } catch (e) {
      return '';
    }
  }

  format(): ISessionFormatted {
    return {
      ...this.session,
      authenticatedAtDate: this.authenticatedAtDate,
      authenticatedAtTime: this.authenticatedAtTime,
      devicesFormatted: this.formatDevices(),
    };
  }
}

// Backward-compatible helper (optional)
export const formatSessionDevices = (session: ISession): IActivityRow[] => (
  new SessionFormatter(session).format().devicesFormatted);


