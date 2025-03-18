import { render, fireEvent } from '@testing-library/vue';
import {
  beforeEach, vi, describe, it, expect,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from 'InvestCommon/store';
import { mockSchema } from 'InvestCommon/services/api/__tests__/__mocks__/authMock';
import createFetchMock from 'vitest-fetch-mock';
import ForgotForm from '../ForgotForm.vue';

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

// vi.mock('UiKit/helpers/validation/general', () => ({
//   scrollToError: vi.fn(),
//   undefinedEmptyProp: vi.fn(),
//   traverse: vi.fn(),
//   filterSchema: vi.fn(),
// }));

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

function renderComponent() {
  const wrapper = render(ForgotForm);

  const email: HTMLInputElement = wrapper.getByTestId('email');
  const button: HTMLButtonElement = wrapper.getByTestId('button');

  return {
    email,
    button,
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

describe('ForgotForm', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    fetchMocker.mockResponse(JSON.stringify(mockSchema));
    await authStore.getSchema();
  });
  it('should mount input', () => {
    const { email } = renderComponent();

    expect(email).toBeDefined();
  });

  it('email should pass validation', async () => {
    const {
      email, button,
    } = renderComponent();

    Element.prototype.scrollIntoView = vi.fn();
    await fireEvent.click(button);

    expect(email?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    await inputTriggerError(email, '123', true);
    await inputTriggerError(email, 'test', true);
    await inputTriggerError(email, 'test@gmail', true);
    await inputTriggerError(email, 'test@gmail.com', false);
  });
});
