import { capitalizeFirstLetter } from 'UiKit/helpers/text';
import {
  urlContactUs, urlOffers, urlNotifications, urlProfileAccreditation,
  urlInvestmentTimeline, urlProfileWallet, urlProfileAccount,
} from 'InvestCommon/domain/config/links';
import {
  ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT,
  ROUTE_DASHBOARD_WALLET, ROUTE_INVESTMENT_TIMELINE, ROUTE_NOTIFICATIONS,
} from 'InvestCommon/domain/config/enums/routes';
import { INotification, IFormattedNotification } from './notifications.types';

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
    if (this.isNotificationInvestment) {
      return 'secondary-light';
    }
    if (this.isNotificationDocument) {
      return 'yellow-light';
    }
    if (this.isNotificationSystem || this.isNotificationUser) {
      return 'default';
    }
    if (this.isNotificationWallet) {
      return 'red-light';
    }
    return 'purple-light';
  }

  get buttonText(): string {
    if (this.kycDeclined || this.isFundsFailed) {
      return 'Contact Us';
    }
    if (this.accreditationDeclined || this.accreditationExpired) {
      return 'Provide info';
    }
    if (this.isStart) {
      return 'Start Investing';
    }
    if (this.isNotificationInvestment || this.isNotificationProfile || this.isNotificationWallet) {
      return 'See More Details';
    }
    if (this.isNotificationDocument) {
      return 'Review Document';
    }
    return 'More Info';
  }

  get tagText(): string {
    if (this.isNotificationProfile) {
      return 'Investment Profile';
    }
    if (this.isNotificationUser) {
      return 'System';
    }
    return capitalizeFirstLetter(this.notification?.type || '');
  }

  get isUnread(): boolean {
    return this.notification?.status.toLowerCase() === 'unread';
  }

  get buttonTo(): string | { name: string; params?: { profileId: number; id?: number } } {
    if (this.kycDeclined || this.isFundsFailed) {
      return urlContactUs;
    }
    if (this.accreditationDeclined || this.accreditationExpired) {
      return {
        name: ROUTE_ACCREDITATION_UPLOAD,
        params: { profileId: this.profileId },
      };
    }
    if (this.isNotificationInvestment) {
      return {
        name: ROUTE_INVESTMENT_TIMELINE,
        params: { profileId: this.profileId, id: this.objectId },
      };
    }
    if (this.isNotificationDocument) {
      return {
        name: ROUTE_NOTIFICATIONS,
      };
    }
    if (this.isNotificationWallet) {
      return {
        name: ROUTE_DASHBOARD_WALLET,
        params: { profileId: this.profileId },
      };
    }
    if (this.isNotificationProfile) {
      return {
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: this.profileId },
      };
    }
    if (this.isStart) {
      return urlOffers;
    }
    return {
      name: ROUTE_NOTIFICATIONS,
    };
  }

  get buttonHref() {
    if (this.kycDeclined || this.isFundsFailed) {
      return urlContactUs;
    }
    if (this.accreditationDeclined || this.accreditationExpired) {
      return urlProfileAccreditation(this.profileId);
    }
    if (this.isNotificationInvestment) {
      return urlInvestmentTimeline(this.profileId, this.objectId);
    }
    if (this.isNotificationDocument) {
      return urlNotifications;
    }
    if (this.isNotificationWallet) {
      return urlProfileWallet(this.profileId);
    }
    if (this.isNotificationProfile) {
      return urlProfileAccount(this.profileId);
    }
    if (this.isStart) {
      return urlOffers;
    }
    return urlNotifications;
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
      buttonTo: this.buttonTo,
      buttonHref: this.buttonHref,
    };
  }
}
