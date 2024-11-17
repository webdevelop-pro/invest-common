
import createFetchMock, { FetchMock } from 'vitest-fetch-mock';
import {
  beforeEach, vi, describe, it, expect,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  ROUTE_CHECK_EMAIL, ROUTE_DASHBOARD_PORTFOLIO, ROUTE_FORGOT, ROUTE_LOGIN, ROUTE_SETTINGS, ROUTE_SIGNUP,
} from 'InvestCommon/helpers/enums/routes';
import { shallowMount } from '@vue/test-utils';
import { useAuthLogicStore } from 'InvestCommon/store';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import App from '@/App.vue';
import { mockLogin, mockRecovery } from './__mocks__/formsMock';
import { createRouter, createWebHistory } from 'vue-router';
import { UserIdentity } from '@/tests/__mocks__/userMock';

vi.mock('InvestCommonglobal', () => ({
  default: {
    KRATOS_URL: 'mocked_kratos_url',
    FRONTEND_URL: 'mocked_frontend_url',
    NOTIFICATION_URL: 'https://notification-api.webdevelop.us',
  },
}));


vi.mock('InvestCommon/store/useUserIdentitys', () => ({
  useUserIdentitysStore: vi.fn().mockReturnValue({
    getUserIndividualProfile: vi.fn().mockReturnValue({
      getUserIndividualProfileData: {
        value: UserIdentity,
      },
    }),
  }),
}));

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

describe('LogInForm', () => {
  beforeEach(() => {
    (fetch as FetchMock).resetMocks();
    setActivePinia(createPinia());
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('should router be ROTE_LOGIN when there is error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_LOGIN;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    fetchMocker.mockReject(new Error('Fetch error'));
    await useAuthLogicStore().onLogin('email', 'pass', SELFSERVICE.login);

    expect(mockRouter.currentRoute.value.name).toBe(ROUTE_LOGIN);
  });
  it.skip('should router be ROUTE_DASHBOARD_PORTFOLIO when there is no error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_LOGIN;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    (fetch as FetchMock).mockResponse(JSON.stringify(mockLogin));
    await useAuthLogicStore().onLogin('email', 'pass', SELFSERVICE.login);

    expect(mockRouter.push.mock.calls[0][0].name).toBe(ROUTE_DASHBOARD_PORTFOLIO);
  });
});

describe('SignUpForm', () => {
  beforeEach(() => {
    (fetch as FetchMock).resetMocks();
    setActivePinia(createPinia());
  });

  it('should router be ROUTE_SIGNUP when there is error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_SIGNUP;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    fetchMocker.mockReject(new Error('Fetch error'));
    await useAuthLogicStore().onSignUp('first', 'last', 'email', 'pass', SELFSERVICE.registration);

    expect(mockRouter.currentRoute.value.name).toBe(ROUTE_SIGNUP);
  });
  it('should router be ROUTE_DASHBOARD_PORTFOLIO when there is no error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_SIGNUP;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    (fetch as FetchMock).mockResponse(JSON.stringify(mockLogin));
    await useAuthLogicStore().onSignUp('first', 'last', 'email', 'pass', SELFSERVICE.registration);

    expect(mockRouter.push.mock.calls[0][0].name).toBe(ROUTE_DASHBOARD_PORTFOLIO);
  });
});

describe('ForgotForm', () => {
  beforeEach(() => {
    (fetch as FetchMock).resetMocks();
    setActivePinia(createPinia());
  });

  it('should router be ROUTE_FORGOT when there is error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_FORGOT;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    fetchMocker.mockReject(new Error('Fetch error'));
    await useAuthLogicStore().onRecovery('email', SELFSERVICE.recovery);

    expect(mockRouter.currentRoute.value.name).toBe(ROUTE_FORGOT);
  });
  it('should router be ROUTE_CHECK_EMAIL when there is no error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_FORGOT;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    (fetch as FetchMock).mockResponse(JSON.stringify(mockRecovery));
    await useAuthLogicStore().onRecovery('email', SELFSERVICE.recovery);

    expect(mockRouter.push.mock.calls[0][0].name).toBe(ROUTE_CHECK_EMAIL);
  });
});

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    (fetch as FetchMock).resetMocks();
    setActivePinia(createPinia());
  });

  it('should router be ROUTE_SETTINGS when there is error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_SETTINGS;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    fetchMocker.mockReject(new Error('Fetch error'));
    await useAuthLogicStore().onReset('pass', SELFSERVICE.settings);

    expect(mockRouter.currentRoute.value.name).toBe(ROUTE_SETTINGS);
  });
  it('should router be ROUTE_DASHBOARD_PORTFOLIO when there is no error', async () => {
    const mockRouter = createRouter({ history: createWebHistory(), routes: [] });
    mockRouter.currentRoute.value.name = ROUTE_SETTINGS;
    shallowMount(App, { global: { plugins: [mockRouter] } });
    vi.spyOn(mockRouter, 'push').mockResolvedValue();

    (fetch as FetchMock).mockResponse(JSON.stringify(mockRecovery));
    await useAuthLogicStore().onReset('pass', SELFSERVICE.settings);

    expect(mockRouter.push.mock.calls[0][0].name).toBe(ROUTE_DASHBOARD_PORTFOLIO);
  });
});
