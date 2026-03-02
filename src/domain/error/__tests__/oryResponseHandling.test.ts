import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { oryResponseHandling } from '../oryResponseHandling';
import type { IAuthFlow } from 'InvestCommon/data/auth/auth.type';

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
    TOAST_REMOVE_DELAY: 10000,
  })),
}));

describe('oryResponseHandling', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
      TOAST_REMOVE_DELAY: 10000,
    });
  });

  it('shows duplicate-account toast when message has "already used by another account" and duplicate_identifier', () => {
    const response = {
      id: 'flow-1',
      type: 'api',
      ui: {},
      messages: [],
      state: null,
      expires_at: '',
      issued_at: '',
      request_url: '',
      return_to: '',
      transient_payload: {},
      active: '',
    } as unknown as IAuthFlow;
    (response as { ui?: { messages?: Array<{ text?: string; context?: Record<string, string> }> } }).ui = {
      messages: [
        {
          text: 'This field is already used by another account',
          context: { duplicate_identifier: 'user@example.com' },
        },
      ],
    };

    oryResponseHandling(response);

    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Account Already Exists',
        variant: 'info',
        duration: 8000,
      }),
    );
    const call = mockToast.mock.calls[0][0];
    expect(call.description).toBeDefined();
    expect(call.description.props.innerHTML).toContain('user@example.com');
    expect(call.description.props.innerHTML).toContain('/signin?email=');
  });

  it('uses duplicateIdentifier when duplicate_identifier is missing (camelCase)', () => {
    const response = {
      id: 'flow-1',
      type: 'api',
      ui: {},
      messages: [],
      state: null,
      expires_at: '',
      issued_at: '',
      request_url: '',
      return_to: '',
      transient_payload: {},
      active: '',
    } as unknown as IAuthFlow;
    (response as { ui?: { messages?: Array<{ text?: string; context?: Record<string, string> }> } }).ui = {
      messages: [
        {
          text: 'already used by another account',
          context: { duplicateIdentifier: 'other@test.com' },
        },
      ],
    };

    oryResponseHandling(response);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Account Already Exists',
      }),
    );
    expect(mockToast.mock.calls[0][0].description.props.innerHTML).toContain('other@test.com');
  });

  it('does not show duplicate toast when duplicate_identifier is missing', () => {
    const response = {
      id: 'flow-1',
      type: 'api',
      ui: { messages: [{ text: 'already used by another account', context: {} }] },
      messages: [],
      state: null,
      expires_at: '',
      issued_at: '',
      request_url: '',
      return_to: '',
      transient_payload: {},
      active: '',
    } as unknown as IAuthFlow;

    oryResponseHandling(response);

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows info toast when response has ui.messages with type info', () => {
    const response = {
      id: 'flow-1',
      type: 'api',
      ui: {
        messages: [
          { type: 'info', text: 'Please check your email to verify.' },
        ],
      },
      messages: [],
      state: null,
      expires_at: '',
      issued_at: '',
      request_url: '',
      return_to: '',
      transient_payload: {},
      active: '',
    } as unknown as IAuthFlow;

    oryResponseHandling(response);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Authentication Information',
      description: 'Please check your email to verify.',
      variant: 'info',
    });
  });

  it('escapes HTML in info message text', () => {
    const response = {
      id: 'flow-1',
      type: 'api',
      ui: {
        messages: [
          { type: 'info', text: 'Click <script>alert(1)</script> here' },
        ],
      },
      messages: [],
      state: null,
      expires_at: '',
      issued_at: '',
      request_url: '',
      return_to: '',
      transient_payload: {},
      active: '',
    } as unknown as IAuthFlow;

    oryResponseHandling(response);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Authentication Information',
      description: 'Click &lt;script&gt;alert(1)&lt;/script&gt; here',
      variant: 'info',
    });
  });

  it('does nothing when response has no ui.messages', () => {
    const response = {
      id: 'flow-1',
      type: 'api',
      ui: {},
      messages: [],
      state: null,
      expires_at: '',
      issued_at: '',
      request_url: '',
      return_to: '',
      transient_payload: {},
      active: '',
    } as unknown as IAuthFlow;

    oryResponseHandling(response);

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does nothing when ui.messages is empty array', () => {
    const response = {
      id: 'flow-1',
      type: 'api',
      ui: { messages: [] },
      messages: [],
      state: null,
      expires_at: '',
      issued_at: '',
      request_url: '',
      return_to: '',
      transient_payload: {},
      active: '',
    } as unknown as IAuthFlow;

    oryResponseHandling(response);

    expect(mockToast).not.toHaveBeenCalled();
  });
});
