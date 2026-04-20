import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardWalletAlert from '../DashboardWalletAlert.vue';

describe('DashboardWalletAlert', () => {
  it('emits descriptionAction when the bank-account link is clicked', async () => {
    const wrapper = mount(DashboardWalletAlert, {
      props: {
        description: 'You need to <a href="/settings/7/bank-accounts">connect a bank account</a> before you can add funds.',
      },
      global: {
        directives: {
          dompurifyHtml: (element, binding) => {
            element.innerHTML = binding.value;
          },
        },
        stubs: {
          VAlert: {
            template: '<div><slot name="title" /><slot name="description" /><slot /></div>',
          },
          VButton: {
            template: '<button><slot /></button>',
          },
          VSpinner: {
            template: '<div />',
          },
          VSkeleton: {
            template: '<div />',
          },
        },
      },
    });

    await wrapper.get('a[href*="bank-accounts"]').trigger('click');

    expect(wrapper.emitted('descriptionAction')).toHaveLength(1);
  });
});
