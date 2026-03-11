import { ISession } from '../auth/auth.type';
import { IActivityRow, ISessionFormatted } from './settings.types';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
});

export const formatToDate = (ISOString: string, withHours = false) => (
  (withHours ? DATETIME_FORMATTER : DATE_FORMATTER).format(new Date(ISOString))
);

export class SessionFormatter {
  private session: ISession;

  constructor(session: ISession) {
    this.session = session;
  }

  format(): ISessionFormatted {
    const authenticatedAt = this.session?.authenticated_at;
    const dateObj = authenticatedAt ? new Date(authenticatedAt) : null;
    const hasValidDate = dateObj !== null && !Number.isNaN(dateObj.getTime());
    const authenticatedAtDate = hasValidDate ? DATE_FORMATTER.format(dateObj) : '';
    const authenticatedAtTime = hasValidDate ? TIME_FORMATTER.format(dateObj) : '';

    return {
      ...this.session,
      authenticatedAtDate,
      authenticatedAtTime,
      devicesFormatted: (this.session?.devices || []).map((device) => ({
        date: authenticatedAtDate,
        time: authenticatedAtTime,
        ip: device?.ip_address,
        browser: device?.user_agent,
        id: this.session?.id,
      })),
    };
  }
}

// Backward-compatible helper (optional)
export const formatSessionDevices = (session: ISession): IActivityRow[] => (
  new SessionFormatter(session).format().devicesFormatted);

