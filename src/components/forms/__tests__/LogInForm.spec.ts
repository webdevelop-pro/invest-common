import { render, screen, fireEvent } from '@testing-library/vue';
import createFetchMock, { FetchMock } from 'vitest-fetch-mock';
import {
  beforeEach, vi, describe, it, expect,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthLogicStore, useAuthStore } from 'InvestCommon/store';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import LogInForm from '../LogInForm.vue';
import { mockLogin } from './__mocks__/formsMock';

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

vi.mock('InvestCommon/store/useUserIdentitys', () => ({
  useUserProfilesStore: vi.fn().mockReturnValue({
    getUserIndividualProfile: vi.fn(),
  }),
}));

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

function renderComponent() {
  const wrapper = render(LogInForm);

  const email = wrapper.getByTestId('email');
  const password = wrapper.getByTestId('password');
  const inputError = wrapper.queryByTestId('input-error');

  return {
    email,
    password,
    inputError,
    wrapper,
  };
}

describe('LogInForm', () => {
  beforeEach(() => {
    (fetch as FetchMock).resetMocks();
    setActivePinia(createPinia());
    Element.prototype.scrollIntoView = vi.fn();
  });
  it('should mount input', () => {
    const { email, password } = renderComponent();

    expect(email).toBeDefined();
    expect(password).toBeDefined();
  });

  it('should shows error msg when email is not valid', async () => {
    const { email, inputError } = renderComponent();

    await fireEvent.update(email, 'test');

    expect(inputError).toBeDefined();
  });

  it('should shows error msg when password length less then 6 characters', async () => {
    const { password, inputError } = renderComponent();

    await fireEvent.update(password, '123');

    expect(inputError).toBeDefined();
  });

  it('should shows error msg when inputs is empty', async () => {
    const { email, password, inputError } = renderComponent();

    await fireEvent.update(email, '');
    await fireEvent.update(password, '');

    expect(inputError).toBeDefined();
  });

  it('should error variable be false when all is ok', async () => {
    renderComponent();
    expect(screen.queryByTestId('login-form')).toBeTruthy();
    (fetch as FetchMock).mockResponse(JSON.stringify(mockLogin));
    const authStore = useAuthStore();
    const usersStore = useUsersStore();

    await useAuthLogicStore().onLogin('email', 'pass', SELFSERVICE.login);

    expect(authStore.isSetLoginError).toBe(false);
    expect(authStore.isGetFlowError).toBe(false);
    expect(authStore.setLoginData?.session).not.toBeUndefined();
    expect(usersStore.isGetUserProfileError).toBe(false);
    expect(usersStore.isGetUserProfileLoading).toBe(true);
  });
  it('should error variable be true when there is error', async () => {
    renderComponent();
    expect(screen.queryByTestId('login-form')).toBeTruthy();
    fetchMocker.mockResponseOnce(JSON.stringify(mockLogin)); // flow is ok
    fetchMocker.mockRejectOnce(new Error('Fetch error')); // login is error
    await useAuthLogicStore().onLogin('email', 'pass', SELFSERVICE.login);
    const authStore = useAuthStore();
    const usersStore = useUsersStore();

    expect(authStore.isGetFlowError).toBe(false);
    expect(authStore.isSetLoginError).toBe(true);
    expect(authStore.setLoginData?.session).toBeUndefined();
    expect(usersStore.isGetUserProfileError).toBe(false);
    expect(usersStore.isGetUserProfileLoading).toBe(false);
    expect(screen.queryByTestId('login-form')).toBeTruthy();
  });
});
