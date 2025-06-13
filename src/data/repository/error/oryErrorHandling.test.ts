import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { oryErrorHandling } from './oryErrorHandling';

// Mock the dependencies
vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
    TOAST_REMOVE_DELAY: 10000,
  })),
}));

vi.mock('InvestCommon/domain/dialogs/store/useDialogs', () => ({
  useDialogs: vi.fn(),
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('InvestCommon/global/links', () => ({
  urlSignin: 'urlSignin',
  urlProfile: 'urlProfile',
  urlAuthenticator: 'urlAuthenticator',
}));

describe('oryErrorHandling', () => {
  const mockToast = vi.fn();
  const mockShowRefreshSession = vi.fn();
  const mockResetFlow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
      TOAST_REMOVE_DELAY: 10000,
    });
    (useDialogs as any).mockReturnValue({ showRefreshSession: mockShowRefreshSession });
    // Reset window.location.href before each test
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost' },
      writable: true,
    });
  });

  it('should handle credentials error (4000006)', () => {
    const error = {
      data: {
        responseJson: {
          ui: {
            messages: [{ type: 'error', id: 4000006 }],
          },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(error.message).toBe('The provided credentials are invalid, check for spelling mistakes in your password or email address');
  });

  it('should handle session_already_available error', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'session_already_available' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(navigateWithQueryParams).toHaveBeenCalledWith('urlProfile');
  });

  it('should handle session_aal2_required error with redirect', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'session_aal2_required' },
          redirect_browser_to: 'http://example.com/2fa',
        },
      },
    };

    oryErrorHandling(error as any, 'settings', mockResetFlow, 'test');
    const expectedUrl = new URL('http://example.com/2fa');
    expectedUrl.searchParams.set('return_to', 'http://example.com/2fa');
    expect(window.location.href).toBe(expectedUrl.toString());
  });

  it('should handle session_aal2_required error without redirect', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'session_aal2_required' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(navigateWithQueryParams).toHaveBeenCalledWith('urlSignin', expect.any(URLSearchParams));
  });

  it('should handle session_refresh_required error', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'session_refresh_required' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(mockShowRefreshSession).toHaveBeenCalled();
  });

  it('should handle browser_location_change_required error with aal2', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'browser_location_change_required' },
          redirect_browser_to: 'http://example.com/aal2',
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(navigateWithQueryParams).toHaveBeenCalledWith('urlAuthenticator');
  });

  it('should handle browser_location_change_required error without aal2', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'browser_location_change_required' },
          redirect_browser_to: 'http://example.com/other',
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(window.location.href).toBe('http://example.com/other');
  });

  it('should handle self_service_flow_expired error', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'self_service_flow_expired' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Your interaction expired, please fill out the form again.',
      description: 'Please try again',
      variant: 'error',
    });
    expect(mockResetFlow).toHaveBeenCalled();
  });

  it('should handle self_service_flow_return_to_forbidden error', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'self_service_flow_return_to_forbidden' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'The return_to address is not allowed.',
      description: 'Please try again',
      variant: 'error',
    });
    expect(mockResetFlow).toHaveBeenCalled();
  });

  it('should handle security_csrf_violation error', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'security_csrf_violation' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'A security violation was detected, please fill out the form again.',
      description: 'Please try again',
      variant: 'error',
    });
    expect(mockResetFlow).toHaveBeenCalled();
  });

  it('should handle security_identity_mismatch error', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'security_identity_mismatch' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(mockResetFlow).toHaveBeenCalled();
  });

  it('should handle session_inactive error', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'session_inactive' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    expect(navigateWithQueryParams).toHaveBeenCalledWith('urlSignin');
  });

  it('should handle unknown error with toasterErrorHandling', () => {
    const error = {
      data: {
        responseJson: {
          error: { id: 'unknown_error' },
        },
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    // Note: We can't directly test toasterErrorHandling since it's imported
    // but we can verify that other handlers weren't called
    expect(mockToast).not.toHaveBeenCalled();
    expect(mockResetFlow).not.toHaveBeenCalled();
    expect(navigateWithQueryParams).not.toHaveBeenCalled();
  });

  it('should handle error without error id', () => {
    const error = {
      data: {
        responseJson: {},
      },
    };

    oryErrorHandling(error as any, 'login', mockResetFlow, 'test');
    // Note: We can't directly test toasterErrorHandling since it's imported
    // but we can verify that other handlers weren't called
    expect(mockToast).not.toHaveBeenCalled();
    expect(mockResetFlow).not.toHaveBeenCalled();
    expect(navigateWithQueryParams).not.toHaveBeenCalled();
  });
});
