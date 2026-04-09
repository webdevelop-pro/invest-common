import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import VKycAlert from '../VKycAlert.vue';

describe('VKycAlert', () => {
  it('renders the normalized alert props and emits the action event', async () => {
    const wrapper = mount(VKycAlert, {
      props: {
        variant: 'error',
        title: 'Finish Your KYC',
        description: 'Complete the remaining identity verification steps.',
        buttonText: 'Continue',
      },
      global: {
        directives: {
          dompurifyHtml: (element, binding) => {
            element.innerHTML = binding.value;
          },
        },
        stubs: {
          VAlert: {
            props: ['variant'],
            template: `
              <div class="alert-stub" :data-variant="variant">
                <div class="alert-stub__title"><slot name="title" /></div>
                <div class="alert-stub__description"><slot name="description" /></div>
                <div class="alert-stub__actions"><slot /></div>
              </div>
            `,
          },
          VButton: {
            emits: ['click'],
            template: '<button class="alert-stub__action" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Finish Your KYC');
    expect(wrapper.text()).toContain('Complete the remaining identity verification steps.');
    expect(wrapper.text()).toContain('Continue');

    await wrapper.find('.alert-stub__action').trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('emits description-action when the rich text is clicked', async () => {
    const wrapper = mount(VKycAlert, {
      props: {
        variant: 'error',
        title: 'Verification Declined',
        description: '<a data-action="contact-us">Contact support</a>',
      },
      global: {
        directives: {
          dompurifyHtml: (element, binding) => {
            element.innerHTML = binding.value;
          },
        },
        stubs: {
          VAlert: {
            template: `
              <div class="alert-stub">
                <slot name="title" />
                <slot name="description" />
                <slot />
              </div>
            `,
          },
          VButton: true,
        },
      },
    });

    await wrapper.find('[data-action="contact-us"]').trigger('click');
    expect(wrapper.emitted('descriptionAction')).toHaveLength(1);
  });

  it('emits description-action when the rich text wrapper is activated from the keyboard', async () => {
    const wrapper = mount(VKycAlert, {
      props: {
        variant: 'error',
        title: 'Verification Declined',
        description: '<a data-action="contact-us">Contact support</a>',
      },
      global: {
        directives: {
          dompurifyHtml: (element, binding) => {
            element.innerHTML = binding.value;
          },
        },
        stubs: {
          VAlert: {
            template: `
              <div class="alert-stub">
                <slot name="title" />
                <slot name="description" />
                <slot />
              </div>
            `,
          },
          VButton: true,
        },
      },
    });

    const description = wrapper.find('span');

    await description.trigger('keydown.enter');
    expect(wrapper.emitted('descriptionAction')).toHaveLength(1);

    await description.trigger('keydown.space');
    expect(wrapper.emitted('descriptionAction')).toHaveLength(2);
  });

  it('does not expose button semantics when the description is plain text', async () => {
    const wrapper = mount(VKycAlert, {
      props: {
        variant: 'info',
        title: 'Verification In Progress',
        description: 'Your KYC review is in progress.',
      },
      global: {
        directives: {
          dompurifyHtml: (element, binding) => {
            element.innerHTML = binding.value;
          },
        },
        stubs: {
          VAlert: {
            template: `
              <div class="alert-stub">
                <slot name="title" />
                <slot name="description" />
                <slot />
              </div>
            `,
          },
          VButton: true,
        },
      },
    });

    const description = wrapper.find('span');
    expect(description.attributes('role')).toBeUndefined();
    expect(description.attributes('tabindex')).toBeUndefined();

    await description.trigger('click');
    expect(wrapper.emitted('descriptionAction')).toBeUndefined();
  });
});
