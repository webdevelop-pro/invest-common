import { render, fireEvent } from '@testing-library/vue';
import {
  beforeEach, vi, describe, it, expect,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import ResetPasswordForm from '../VFormResetPassword.vue';

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

function renderComponent() {
  const wrapper = render(ResetPasswordForm);

  const password1: HTMLInputElement = wrapper.getByTestId('create-password');
  const password2: HTMLInputElement = wrapper.getByTestId('repeat-password');
  const error = wrapper.queryByTestId('input-error');
  const button: HTMLButtonElement = wrapper.getByTestId('button');

  return {
    password1,
    password2,
    error,
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

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Element.prototype.scrollIntoView = vi.fn();
  });
  it('should mount input', () => {
    const { password1, password2 } = renderComponent();

    expect(password1).toBeDefined();
    expect(password2).toBeDefined();
  });

  it('password1 should pass validation', async () => {
    const {
      password1, button,
    } = renderComponent();
    await fireEvent.click(button);

    expect(password1?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    await inputTriggerError(password1, '12345', true);
    await inputTriggerError(password1, '123456789', false);
  });

  it('password2 should pass validation', async () => {
    const {
      password2, button,
    } = renderComponent();
    await fireEvent.click(button);

    expect(password2?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    await inputTriggerError(password2, '12345', true);
    await inputTriggerError(password2, '123456789', false);
  });
});
