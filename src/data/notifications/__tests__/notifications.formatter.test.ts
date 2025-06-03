import { describe, it, expect } from 'vitest';
import { NotificationFormatter } from '../notifications.formatter';
import {
  urlInvestmentTimeline, urlContactUs, urlNotifications, urlProfileAccreditation, urlProfileWallet, urlProfileAccount,
} from '../../../global/links';
import {
  ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_WALLET, ROUTE_NOTIFICATIONS,
} from '../../../helpers/enums/routes';

describe('NotificationFormatter', () => {
  const mockNotification = {
    id: 1,
    type: 'investment',
    status: 'unread',
    data: {
      fields: {
        amount: '2000.00',
        funding_type: 'wire',
        object_id: 123,
        profile: {
          ID: 456,
          type: 'individual',
        },
        offer: {
          Name: 'Leaders Highlight the AI Disruptors Fund',
          Slug: 'leaders-highlight-the-ai-disruptors-fund',
        },
        status: 'confirmed',
      },
      obj: 'investment',
    },
  };

  const mockDocumentNotification = {
    id: 2,
    type: 'document',
    status: 'unread',
    data: {
      fields: {
        object_id: 789,
        profile: {
          ID: 101,
          type: 'individual',
        },
      },
    },
  };

  it('should correctly identify notification types', () => {
    const formatter = new NotificationFormatter(mockNotification);
    expect(formatter.isNotificationInvestment).toBe(true);
    expect(formatter.isNotificationDocument).toBe(false);
    expect(formatter.isNotificationSystem).toBe(false);
    expect(formatter.isNotificationWallet).toBe(false);
    expect(formatter.isNotificationProfile).toBe(false);
    expect(formatter.isNotificationUser).toBe(false);
  });

  it('should correctly extract IDs', () => {
    const formatter = new NotificationFormatter(mockNotification);
    expect(formatter.objectId).toBe(123);
    expect(formatter.profileId).toBe(456);
  });

  it('should correctly identify status flags', () => {
    const formatter = new NotificationFormatter(mockNotification);
    expect(formatter.kycDeclined).toBe(false);
    expect(formatter.accreditationDeclined).toBe(false);
    expect(formatter.accreditationExpired).toBe(false);
    expect(formatter.isStart).toBe(false);
    expect(formatter.isFundsFailed).toBe(false);
    expect(formatter.isUnread).toBe(true);
  });

  it('should return correct tag background colors', () => {
    const formatter = new NotificationFormatter(mockNotification);
    expect(formatter.tagBackground).toBe('secondary-light');

    const systemNotification = { ...mockNotification, type: 'system_update' };
    const systemFormatter = new NotificationFormatter(systemNotification);
    expect(systemFormatter.tagBackground).toBe('default');
  });

  it('should return correct button text', () => {
    const formatter = new NotificationFormatter(mockNotification);
    expect(formatter.buttonText).toBe('See More Details');

    const docFormatter = new NotificationFormatter(mockDocumentNotification);
    expect(docFormatter.buttonText).toBe('Review Document');
  });

  it('should return correct tag text', () => {
    const formatter = new NotificationFormatter(mockNotification);
    expect(formatter.tagText).toBe('Investment');

    const profileNotification = { ...mockNotification, type: 'profile_update' };
    const profileFormatter = new NotificationFormatter(profileNotification);
    expect(profileFormatter.tagText).toBe('Investment Profile');
  });

  it('should format notification correctly', () => {
    const formatter = new NotificationFormatter(mockNotification);
    const formatted = formatter.format();

    expect(formatted).toEqual({
      ...mockNotification,
      isNotificationInvestment: true,
      isNotificationDocument: false,
      isNotificationSystem: false,
      isNotificationWallet: false,
      isNotificationProfile: false,
      isNotificationUser: false,
      objectId: 123,
      profileId: 456,
      kycDeclined: false,
      accreditationDeclined: false,
      accreditationExpired: false,
      isStart: false,
      isFundsFailed: false,
      tagBackground: 'secondary-light',
      buttonText: 'See More Details',
      tagText: 'Investment',
      isUnread: true,
      buttonTo: {
        name: 'ROUTE_INVESTMENT_TIMELINE',
        params: { profileId: 456, id: 123 },
      },
      buttonHref: urlInvestmentTimeline(456, '123'),
    });
  });

  describe('Status Flags', () => {
    it('should handle KYC declined status', () => {
      const kycDeclinedNotification = {
        ...mockNotification,
        data: {
          ...mockNotification.data,
          fields: {
            ...mockNotification.data.fields,
            kyc_status: 'declined',
          },
        },
      };
      const formatter = new NotificationFormatter(kycDeclinedNotification);
      expect(formatter.kycDeclined).toBe(true);
      expect(formatter.buttonText).toBe('Contact Us');
      expect(formatter.buttonTo).toBe(urlContactUs);
      expect(formatter.buttonHref).toBe(urlContactUs);
    });

    it('should handle accreditation declined status', () => {
      const accDeclinedNotification = {
        ...mockNotification,
        data: {
          ...mockNotification.data,
          fields: {
            ...mockNotification.data.fields,
            accreditation_status: 'declined',
          },
        },
      };
      const formatter = new NotificationFormatter(accDeclinedNotification);
      expect(formatter.accreditationDeclined).toBe(true);
      expect(formatter.buttonText).toBe('Provide info');
      expect(formatter.buttonTo).toEqual({
        name: ROUTE_ACCREDITATION_UPLOAD,
        params: { profileId: 456 },
      });
      expect(formatter.buttonHref).toBe(urlProfileAccreditation(456));
    });

    it('should handle accreditation expired status', () => {
      const accExpiredNotification = {
        ...mockNotification,
        data: {
          ...mockNotification.data,
          fields: {
            ...mockNotification.data.fields,
            accreditation_status: 'expired',
          },
        },
      };
      const formatter = new NotificationFormatter(accExpiredNotification);
      expect(formatter.accreditationExpired).toBe(true);
      expect(formatter.buttonText).toBe('Provide info');
    });

    it('should handle funds failed status', () => {
      const fundsFailedNotification = {
        ...mockNotification,
        data: {
          ...mockNotification.data,
          fields: {
            ...mockNotification.data.fields,
            funding_status: 'failed',
          },
        },
      };
      const formatter = new NotificationFormatter(fundsFailedNotification);
      expect(formatter.isFundsFailed).toBe(true);
      expect(formatter.buttonText).toBe('Contact Us');
      expect(formatter.buttonTo).toBe(urlContactUs);
      expect(formatter.buttonHref).toBe(urlContactUs);
    });
  });

  describe('Notification Types', () => {
    it('should handle wallet notifications', () => {
      const walletNotification = {
        ...mockNotification,
        type: 'wallet_update',
      };
      const formatter = new NotificationFormatter(walletNotification);
      expect(formatter.isNotificationWallet).toBe(true);
      expect(formatter.tagBackground).toBe('red-light');
      expect(formatter.buttonText).toBe('See More Details');
      expect(formatter.buttonTo).toEqual({
        name: ROUTE_DASHBOARD_WALLET,
        params: { profileId: 456 },
      });
      expect(formatter.buttonHref).toBe(urlProfileWallet(456));
    });

    it('should handle user notifications', () => {
      const userNotification = {
        ...mockNotification,
        type: 'user_update',
      };
      const formatter = new NotificationFormatter(userNotification);
      expect(formatter.isNotificationUser).toBe(true);
      expect(formatter.tagBackground).toBe('default');
      expect(formatter.tagText).toBe('System');
      expect(formatter.buttonText).toBe('More Info');
      expect(formatter.buttonTo).toEqual({
        name: ROUTE_NOTIFICATIONS,
      });
      expect(formatter.buttonHref).toBe(urlNotifications);
    });

    it('should handle profile notifications', () => {
      const profileNotification = {
        ...mockNotification,
        type: 'profile_update',
      };
      const formatter = new NotificationFormatter(profileNotification);
      expect(formatter.isNotificationProfile).toBe(true);
      expect(formatter.tagText).toBe('Investment Profile');
      expect(formatter.buttonText).toBe('See More Details');
      expect(formatter.buttonTo).toEqual({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: 456 },
      });
      expect(formatter.buttonHref).toBe(urlProfileAccount(456));
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data fields', () => {
      const minimalNotification = {
        id: 1,
        type: 'investment',
        status: 'unread',
        data: {
          fields: {},
        },
      };
      const formatter = new NotificationFormatter(minimalNotification);
      expect(formatter.objectId).toBe(0);
      expect(formatter.profileId).toBe(0);
      expect(formatter.kycDeclined).toBe(false);
      expect(formatter.accreditationDeclined).toBe(false);
      expect(formatter.accreditationExpired).toBe(false);
      expect(formatter.isStart).toBe(false);
      expect(formatter.isFundsFailed).toBe(false);
    });

    it('should handle case-insensitive type matching', () => {
      const mixedCaseNotification = {
        ...mockNotification,
        type: 'INVESTMENT',
      };
      const formatter = new NotificationFormatter(mixedCaseNotification);
      expect(formatter.isNotificationInvestment).toBe(true);
    });

    it('should handle unknown notification types', () => {
      const unknownNotification = {
        ...mockNotification,
        type: 'unknown_type',
      };
      const formatter = new NotificationFormatter(unknownNotification);
      expect(formatter.tagBackground).toBe('purple-light');
      expect(formatter.buttonText).toBe('More Info');
      expect(formatter.buttonTo).toEqual({
        name: ROUTE_NOTIFICATIONS,
      });
      expect(formatter.buttonHref).toBe(urlNotifications);
    });
  });
});
