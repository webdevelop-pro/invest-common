import { render, fireEvent } from '@testing-library/vue';
import {
  beforeEach, vi, describe, it, expect,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from 'InvestCommon/store';
import { mockSchema } from 'InvestCommon/services/api/__tests__/__mocks__/authMock';
import createFetchMock from 'vitest-fetch-mock';
import SignUpForm from '../SignUpForm.vue';

vi.mock('vue-router', () => ({
  useRouter: vi.fn().mockReturnValue({
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
  const wrapper = render(SignUpForm);

  const firsName: HTMLInputElement = wrapper.getByTestId('first-name');
  const lastName: HTMLInputElement = wrapper.getByTestId('last-name');
  const email: HTMLInputElement = wrapper.getByTestId('email');
  const password: HTMLInputElement = wrapper.getByTestId('create-password');
  const button: HTMLButtonElement = wrapper.getByTestId('button');
  const checkboxes: HTMLInputElement[] = wrapper.getAllByTestId('base-checkbox');

  return {
    firsName,
    lastName,
    email,
    password,
    button,
    checkboxes,
  };
}

const inputTriggerError = async (el: HTMLInputElement, value: string, isTruthy: boolean) => {
  await fireEvent.update(el, value);
  if (isTruthy) {
    expect(el?.parentElement?.classList.contains('is--error')).toBe(true);
  } else {
    expect(el?.parentElement?.classList.contains('is--error')).toBe(false);
  }
};

describe('SignUpForm', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    fetchMocker.mockResponse(JSON.stringify(mockSchema));
    await authStore.getSchema();
    Element.prototype.scrollIntoView = vi.fn();
  });
  it('should mount input', () => {
    const {
      firsName,
      lastName,
      email,
      password,
    } = renderComponent();

    expect(firsName).toBeDefined();
    expect(lastName).toBeDefined();
    expect(email).toBeDefined();
    expect(password).toBeDefined();
  });

  it('first name should pass validation', async () => {
    const {
      firsName, button, checkboxes,
    } = renderComponent();
    await fireEvent.click(checkboxes[0]);
    await fireEvent.click(button);

    expect(firsName?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    await inputTriggerError(firsName, 'a', true);
    await inputTriggerError(firsName, 'abc', false);
  });

  it('last name should pass validation', async () => {
    const {
      lastName, button, checkboxes,
    } = renderComponent();
    await fireEvent.click(checkboxes[0]);
    await fireEvent.click(button);

    expect(lastName?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    await inputTriggerError(lastName, 'a', true);
    await inputTriggerError(lastName, 'abc', false);
  });

  it('email should pass validation', async () => {
    const {
      email, button, checkboxes,
    } = renderComponent();
    await fireEvent.click(checkboxes[0]);
    await fireEvent.click(button);

    expect(email?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    await inputTriggerError(email, '123', true);
    await inputTriggerError(email, 'test', true);
    await inputTriggerError(email, 'test@gmail', true);
    await inputTriggerError(email, 'test@gmail.com', false);
  });

  it('password should pass validation', async () => {
    const {
      password, button, checkboxes,
    } = renderComponent();
    await fireEvent.click(checkboxes[0]);
    await fireEvent.click(button);

    expect(password?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    await inputTriggerError(password, '12345', true);
    await inputTriggerError(password, '12345678', false);
  });
});
