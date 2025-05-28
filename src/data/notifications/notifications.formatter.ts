import { INotification } from 'InvestCommon/types/api/notifications';
import { capitalizeFirstLetter } from 'UiKit/helpers/text';

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
}

export class NotificationFormatter {
  private notification: INotification;

  constructor(notification: INotification) {
    this.notification = notification;
  }

  get isNotificationInvestment(): boolean {
    return this.notification?.type.toLowerCase().includes('investment');
  }

  get isNotificationDocument(): boolean {
    return this.notification?.type.toLowerCase().includes('document');
  }

  get isNotificationSystem(): boolean {
    return this.notification?.type.toLowerCase().includes('system');
  }

  get isNotificationWallet(): boolean {
    return this.notification?.type.toLowerCase().includes('wallet');
  }

  get isNotificationProfile(): boolean {
    return this.notification?.type.toLowerCase().includes('profile');
  }

  get isNotificationUser(): boolean {
    return this.notification?.type.toLowerCase().includes('user');
  }

  get objectId(): number {
    return this.notification?.data?.fields?.object_id || 0;
  }

  get profileId(): number {
    return this.notification?.data?.fields?.profile?.ID || this.objectId;
  }

  get kycDeclined(): boolean {
    return this.notification?.data?.fields?.kyc_status === 'declined';
  }

  get accreditationDeclined(): boolean {
    return this.notification?.data?.fields?.accreditation_status === 'declined';
  }

  get accreditationExpired(): boolean {
    return this.notification?.data?.fields?.accreditation_status === 'expired';
  }

  get isStart(): boolean {
    return this.notification?.data?.fields?.profile?.kyc_status === 'new';
  }

  get isFundsFailed(): boolean {
    return this.notification?.data?.fields?.funding_status === 'failed';
  }

  get tagBackground(): string {
    if (this.isNotificationInvestment) return 'secondary-light';
    if (this.isNotificationDocument) return 'yellow-light';
    if (this.isNotificationSystem || this.isNotificationUser) return 'default';
    if (this.isNotificationWallet) return 'red-light';
    return 'purple-light';
  }

  get buttonText(): string {
    if (this.kycDeclined || this.isFundsFailed) return 'Contact Us';
    if (this.accreditationDeclined || this.accreditationExpired) return 'Provide info';
    if (this.isNotificationInvestment || this.isNotificationProfile || this.isNotificationWallet) return 'See More Details';
    if (this.isNotificationDocument) return 'Review Document';
    if (this.isStart) return 'Start Investing';
    return 'More Info';
  }

  get tagText(): string {
    if (this.isNotificationProfile) return 'Investment Profile';
    if (this.isNotificationUser) return 'System';
    return capitalizeFirstLetter(this.notification?.type || '');
  }

  get isUnread(): boolean {
    return this.notification?.status.toLowerCase() === 'unread';
  }

  format(): IFormattedNotification {
    return {
      ...this.notification,
      isNotificationInvestment: this.isNotificationInvestment,
      isNotificationDocument: this.isNotificationDocument,
      isNotificationSystem: this.isNotificationSystem,
      isNotificationWallet: this.isNotificationWallet,
      isNotificationProfile: this.isNotificationProfile,
      isNotificationUser: this.isNotificationUser,
      objectId: this.objectId,
      profileId: this.profileId,
      kycDeclined: this.kycDeclined,
      accreditationDeclined: this.accreditationDeclined,
      accreditationExpired: this.accreditationExpired,
      isStart: this.isStart,
      isFundsFailed: this.isFundsFailed,
      tagBackground: this.tagBackground,
      buttonText: this.buttonText,
      tagText: this.tagText,
      isUnread: this.isUnread,
    };
  }
}
