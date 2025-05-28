import { describe, it, expect } from 'vitest';
import { NotificationFormatter } from '../notifications.formatter';

describe('NotificationFormatter', () => {
  const mockNotification = {
    id: 1,
    type: 'investment_completed',
    status: 'unread',
    data: {
      fields: {
        object_id: 123,
        profile: {
          ID: 456,
          kyc_status: 'new',
        },
        kyc_status: 'declined',
        accreditation_status: 'declined',
        funding_status: 'failed',
      },
    },
  };

  const mockDocumentNotification = {
    id: 2,
    type: 'document_review',
    status: 'unread',
    data: {
      fields: {
        object_id: 789,
        profile: {
          ID: 101,
          kyc_status: 'approved',
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
    expect(formatter.kycDeclined).toBe(true);
    expect(formatter.accreditationDeclined).toBe(true);
    expect(formatter.accreditationExpired).toBe(false);
    expect(formatter.isStart).toBe(true);
    expect(formatter.isFundsFailed).toBe(true);
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
    expect(formatter.buttonText).toBe('Contact Us');

    const docFormatter = new NotificationFormatter(mockDocumentNotification);
    expect(docFormatter.buttonText).toBe('Review Document');
  });

  it('should return correct tag text', () => {
    const formatter = new NotificationFormatter(mockNotification);
    expect(formatter.tagText).toBe('Investment_completed');

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
      kycDeclined: true,
      accreditationDeclined: true,
      accreditationExpired: false,
      isStart: true,
      isFundsFailed: true,
      tagBackground: 'secondary-light',
      buttonText: 'Contact Us',
      tagText: 'Investment_completed',
      isUnread: true,
    });
  });
});
