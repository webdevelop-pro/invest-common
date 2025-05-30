import { describe, it, expect } from 'vitest';
import { NotificationFormatter } from '../notifications.formatter';
import { urlInvestmentTimeline } from '../../../global/links';

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
});
