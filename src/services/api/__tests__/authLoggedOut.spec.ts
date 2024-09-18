import createFetchMock, { FetchMock } from 'vitest-fetch-mock';
import {
  Mock, beforeEach, vi, describe, it, expect,
} from 'vitest';
import { render } from '@testing-library/vue';
import { createRouter } from '@/router';
import { fetchGetSession } from '../auth';
import { mockSchema, mockedLoggedOutSession } from './__mocks__/authMock';
import { setActivePinia, createPinia } from 'pinia';

import App from '@/App.vue';
import { useAuthStore } from 'InvestCommon/store';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
window.scrollTo = vi.fn() as Mock;

describe('Auth Service', () => {
  beforeEach(async () => {
    (fetch as FetchMock).resetMocks();
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    fetchMocker.mockResponse(JSON.stringify(mockSchema));
    await authStore.getSchema();
  });

  it('makes a GET request to fetch session when user is logged out', async () => {
    const router = createRouter();
    render(App, {
      global: {
        plugins: [router],
        stubs: {
          notifications: true,
        },
      },
    });

    (fetch as FetchMock).mockResponse(JSON.stringify(mockedLoggedOutSession));

    const sessionResponse = await fetchGetSession();

    expect(sessionResponse).toEqual(mockedLoggedOutSession);

    await router.push('/profile/wallet');

    // expect(screen.getByText('Log In')).toBeTruthy();
  });
});
