import { capitalizeFirstLetter } from 'UiKit/helpers/text';
import {
  urlContactUs, urlOffers, urlNotifications, urlProfileAccreditation,
  urlInvestmentTimeline, urlProfileWallet, urlProfileAccount,
} from 'InvestCommon/domain/config/links';
import {
  ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT,
  ROUTE_DASHBOARD_WALLET, ROUTE_INVESTMENT_TIMELINE, ROUTE_NOTIFICATIONS,
} from 'InvestCommon/domain/config/enums/routes';
import { INotification, IFormattedNotification, INotificationDataFields } from './notifications.types';

export class NotificationFormatter {
  private readonly notification: INotification;

  private readonly typeLower: string;

  private readonly fields: INotificationDataFields;

  constructor(notification: INotification) {
    this.notification = notification;
    this.typeLower = (notification?.type || '').toLowerCase();
    this.fields = notification?.data?.fields ?? {};
  }

  format(): IFormattedNotification {
    const isNotificationInvestment = this.typeLower.includes('investment');
    const isNotificationDocument = this.typeLower.includes('document');
    const isNotificationSystem = this.typeLower.includes('system');
    const isNotificationWallet = this.typeLower.includes('wallet');
    const isNotificationProfile = this.typeLower.includes('profile');
    const isNotificationUser = this.typeLower.includes('user');

    const objectId = this.fields.object_id || 0;
    const profileId = (this.fields.profile as { ID?: number; id?: number } | undefined)?.ID
      || this.fields.profile?.id
      || objectId;
    const kycDeclined = this.fields.kyc_status === 'declined';
    const accreditationDeclined = this.fields.accreditation_status === 'declined';
    const accreditationExpired = this.fields.accreditation_status === 'expired';
    const isStart = this.fields.profile?.kyc_status === 'new';
    const isFundsFailed = this.fields.funding_status === 'failed';

    let tagBackground = 'purple-light';
    if (isNotificationInvestment) {
      tagBackground = 'secondary-light';
    } else if (isNotificationDocument) {
      tagBackground = 'yellow-light';
    } else if (isNotificationSystem || isNotificationUser) {
      tagBackground = 'default';
    } else if (isNotificationWallet) {
      tagBackground = 'red-light';
    }

    let buttonText = 'More Info';
    if (kycDeclined || isFundsFailed) {
      buttonText = 'Contact Us';
    } else if (accreditationDeclined || accreditationExpired) {
      buttonText = 'Provide info';
    } else if (isStart) {
      buttonText = 'Start Investing';
    } else if (isNotificationInvestment || isNotificationProfile || isNotificationWallet) {
      buttonText = 'See More Details';
    } else if (isNotificationDocument) {
      buttonText = 'Review Document';
    }

    const tagText = isNotificationProfile
      ? 'Investment Profile'
      : isNotificationUser
        ? 'System'
        : capitalizeFirstLetter(this.notification?.type || '');
    const isUnread = this.notification?.status.toLowerCase() === 'unread';

    let buttonTo: string | { name: string; params?: { profileId: number; id?: number } } = {
      name: ROUTE_NOTIFICATIONS,
    };
    let buttonHref = urlNotifications;

    if (kycDeclined || isFundsFailed) {
      buttonTo = urlContactUs;
      buttonHref = urlContactUs;
    } else if (accreditationDeclined || accreditationExpired) {
      buttonTo = {
        name: ROUTE_ACCREDITATION_UPLOAD,
        params: { profileId },
      };
      buttonHref = urlProfileAccreditation(profileId);
    } else if (isNotificationInvestment) {
      buttonTo = {
        name: ROUTE_INVESTMENT_TIMELINE,
        params: { profileId, id: objectId },
      };
      buttonHref = urlInvestmentTimeline(profileId, String(objectId));
    } else if (isNotificationDocument) {
      buttonTo = {
        name: ROUTE_NOTIFICATIONS,
      };
      buttonHref = urlNotifications;
    } else if (isNotificationWallet) {
      buttonTo = {
        name: ROUTE_DASHBOARD_WALLET,
        params: { profileId },
      };
      buttonHref = urlProfileWallet(profileId);
    } else if (isNotificationProfile) {
      buttonTo = {
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId },
      };
      buttonHref = urlProfileAccount(profileId);
    } else if (isStart) {
      buttonTo = urlOffers;
      buttonHref = urlOffers;
    }

    return {
      ...this.notification,
      isNotificationInvestment,
      isNotificationDocument,
      isNotificationSystem,
      isNotificationWallet,
      isNotificationProfile,
      isNotificationUser,
      objectId,
      profileId,
      kycDeclined,
      accreditationDeclined,
      accreditationExpired,
      isStart,
      isFundsFailed,
      tagBackground,
      buttonText,
      tagText,
      isUnread,
      buttonTo: buttonTo as unknown as string,
      buttonHref,
    };
  }
}
