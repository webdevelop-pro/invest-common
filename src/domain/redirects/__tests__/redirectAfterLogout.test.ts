import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlOffers, urlSignin } from 'InvestCommon/global/links';
import { redirectAfterLogout } from '../redirectAfterLogout';

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('InvestCommon/global/links', () => ({
  urlOffers: '/offers',
  urlSignin: '/signin',
}));

describe('redirectAfterLogout', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('should redirect to signin with offer path when pathname includes "offer"', async () => {
    window.location.pathname = '/offer/123';
    await redirectAfterLogout();
    expect(navigateWithQueryParams).toHaveBeenCalledWith(urlSignin, {
      redirect: '/offer/123',
    });
  });

  it('should redirect to signin with urlOffers when pathname includes "/invest"', async () => {
    window.location.pathname = '/invest/something';
    await redirectAfterLogout();
    expect(navigateWithQueryParams).toHaveBeenCalledWith(urlSignin, {
      redirect: urlOffers,
    });
  });

  it('should redirect to signin without params when pathname matches no conditions', async () => {
    window.location.pathname = '/some-other-path';
    await redirectAfterLogout();
    expect(navigateWithQueryParams).toHaveBeenCalledWith(urlSignin, undefined);
  });
});
