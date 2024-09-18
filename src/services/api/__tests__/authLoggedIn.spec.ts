import createFetchMock, { FetchMock } from 'vitest-fetch-mock';
import {
  Mock, beforeEach, vi, describe, it, expect,
} from 'vitest';
import { render } from '@testing-library/vue';
import { fetchGetSession } from '../auth';
import { mockSchema, mockedLoggedInSession } from './__mocks__/authMock';
import { setActivePinia, createPinia } from 'pinia';

import App from '@/App.vue';
import { useAuthStore, useUsersStore } from 'InvestCommon/store';
import { userUserData } from '@/tests/__mocks__';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

vi.mock('InvestCommon/store/core', () => ({
  useCore: vi.fn().mockReturnValue({
    person: {
      value: {
        loggedIn: true, updateSession: vi.fn(), resetAll: vi.fn(), sessionTimer: vi.fn(), setUserData: vi.fn(),
      },
    },
    socket: { value: { connect: vi.fn(), disconnect: vi.fn(), onMessage: vi.fn() } },
  }),
}));


vi.mock('vue-router', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    currentRoute: {
      value: {
        meta: {
          auth: true,
        },
      },
    },
  }),
  useRoute: () => ({
    params: { profileId: '1' },
  }),
}));


vi.mock('InvestCommon/composable/useSegment', () => ({
  useSegment: vi.fn().mockReturnValue({ analyticsPage: vi.fn() }),
}));

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
window.scrollTo = vi.fn() as Mock;

describe('Auth Service', () => {
  beforeEach(async () => {
    (fetch as FetchMock).resetMocks();
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    fetchMocker.mockResponse(JSON.stringify(mockSchema));
    await authStore.getSchema();
    fetchMocker.mockResponse(JSON.stringify(userUserData));
    const usersStore = useUsersStore();
    usersStore.$patch({ getUserIdentityData: userUserData });
  });

  it('makes a GET request to fetch session when user is logged in', async () => {
    render(App, {
      global: {
        stubs: {
          notifications: true,
        },
      },
    });
    (fetch as FetchMock).mockResponse(JSON.stringify(mockedLoggedInSession));
    const sessionResponse = await fetchGetSession();
    expect(sessionResponse).toEqual(mockedLoggedInSession);
  });
});
