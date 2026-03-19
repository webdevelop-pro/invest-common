import { IUser, IProfileFormatted, IUserFormatted, IProfileIndividual } from '../profiles.types';
import { ProfileFormatter } from './profiles.formatter';

export function formatDateToShortMonthDateYear(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const formatted = date.toLocaleDateString('en-US', options);
  return formatted.replace(/^[A-Z]/, (m) => m);
}

export function formatPhoneNumber(input: string | number): string | undefined {
  const digits = input.toString().replace(/\D/g, '');

  if (digits.length !== 11 || !digits.startsWith('1')) {
    return undefined;
  }

  const areaCode = digits.slice(1, 4);
  const centralOfficeCode = digits.slice(4, 7);
  const lineNumber = digits.slice(7, 11);

  return `+1 (${areaCode}) ${centralOfficeCode} - ${lineNumber}`;
}

export class UserFormatter {
  private user: IUser;
  private formatProfile: (profile: IProfileIndividual) => IProfileFormatted;

  constructor(
    user: IUser,
    formatProfile: (profile: IProfileIndividual) => IProfileFormatted = (
      profile,
    ) => new ProfileFormatter(profile).format(),
  ) {
    this.user = user;
    this.formatProfile = formatProfile;
  }

  get fullName(): string {
    const first = this.user?.first_name || '';
    const last = this.user?.last_name || '';
    return `${first} ${last}`.trim();
  }

  get createdAtFormattedShortMonth(): string {
    return this.user?.created_at ? formatDateToShortMonthDateYear(this.user.created_at) : '-';
  }

  get phoneFormatted(): string | undefined {
    return this.user?.phone ? formatPhoneNumber(this.user.phone) : undefined;
  }

  private formatProfiles(): IProfileFormatted[] {
    return (this.user?.profiles || []).map((profile: IProfileIndividual) =>
      this.formatProfile(profile),
    );
  }

  format(): IUserFormatted {
    return {
      ...this.user,
      fullName: this.fullName,
      createdAtFormattedShortMonth: this.createdAtFormattedShortMonth,
      phoneFormatted: this.phoneFormatted,
      profiles: this.formatProfiles(),
    } as IUserFormatted;
  }
}
