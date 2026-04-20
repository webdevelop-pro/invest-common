import {
  describe, expect, it,
} from 'vitest';
import { mount } from '@vue/test-utils';
import VAccreditationAlert from '../VAccreditationAlert.vue';

const mountAlert = (props: Record<string, unknown> = {}) => mount(VAccreditationAlert, {
  props,
  global: {
    directives: {
      dompurifyHtml: (element, binding) => {
        element.innerHTML = binding.value;
      },
    },
    stubs: {
      VAlert: {
        props: ['variant'],
        emits: ['click'],
        template: `
          <div class="v-alert-stub" :data-variant="variant" @click="$emit('click', $event)">
            <div class="v-alert-stub__title"><slot name="title" /></div>
            <div class="v-alert-stub__description"><slot name="description" /></div>
            <div class="v-alert-stub__actions"><slot /></div>
          </div>
        `,
      },
      VButton: {
        props: ['color', 'loading', 'disabled'],
        emits: ['click'],
        template: `
          <button
            class="v-button-stub"
            :data-color="color"
            :data-loading="String(loading)"
            :disabled="disabled"
            @click="$emit('click')"
          >
            <slot />
          </button>
        `,
      },
      VSkeleton: {
        props: ['height', 'width'],
        template: '<div data-testid="accreditation-skeleton" />',
      },
    },
  },
});

describe('VAccreditationAlert', () => {
  it('renders a skeleton while loading before alert content is available', () => {
    const wrapper = mountAlert({
      isLoading: true,
    });

    expect(wrapper.find('[data-testid="accreditation-skeleton"]').exists()).toBe(true);
    expect(wrapper.find('.v-alert-stub').exists()).toBe(false);
  });

  it('emits the primary action and uses the red button for error alerts', async () => {
    const wrapper = mountAlert({
      variant: 'error',
      title: 'Verification failed',
      description: 'Please resubmit your documents.',
      buttonText: 'Verify Accreditation',
    });

    const button = wrapper.find('.v-button-stub');

    expect(button.attributes('data-color')).toBe('red');

    await button.trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('emits descriptionAction only when the rendered copy includes a contact-us action marker', async () => {
    const wrapper = mountAlert({
      title: 'Need help?',
      description: 'Please <a data-action="contact-us">contact us</a> to continue.',
    });

    await wrapper.find('.v-alert-stub').trigger('click');

    expect(wrapper.emitted('descriptionAction')).toHaveLength(1);
  });

  it('ignores description clicks when there is no action marker in the content', async () => {
    const wrapper = mountAlert({
      title: 'Need help?',
      description: 'Please review your uploaded documents.',
    });

    await wrapper.find('.v-alert-stub').trigger('click');

    expect(wrapper.emitted('descriptionAction')).toBeUndefined();
  });
});
