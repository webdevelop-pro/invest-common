import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import VAccountPhoto from '../VAccountPhoto.vue';
import { ref } from 'vue';
import env from 'InvestCommon/global';

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: () => ({
    uploadHandler: vi.fn(() => Promise.resolve(true)),
    postSignurlState: ref({ data: { meta: { id: 123 } } }),
  }),
}));

describe('VAccountPhoto.vue', () => {
  const userId = 1;
  const imageId = 42;

  it('renders avatar with correct image url', () => {
    const wrapper = mount(VAccountPhoto, {
      props: { userId, imageId },
    });
    const avatar = wrapper.findComponent({ name: 'VAvatar' });
    expect(avatar.exists()).toBe(true);
    expect(avatar.props('src')).toContain(`${env.FILER_URL}/auth/files/${imageId}`);
  });

  it('emits upload-id after successful upload', async () => {
    const wrapper = mount(VAccountPhoto, {
      props: { userId, imageId },
    });
    const input = wrapper.find('input[type="file"]');
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });
    await input.trigger('change');
    await flushPromises();
    const emitted = wrapper.emitted('upload-id');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toBe(123);
  });

  it('clicks the button to open file dialog', async () => {
    const wrapper = mount(VAccountPhoto, {
      props: { userId, imageId },
    });
    const input = wrapper.find('input[type="file"]');
    (input.element as HTMLInputElement).click = vi.fn();
    const button = wrapper.findComponent({ name: 'VButton' });
    await button.trigger('click');
    expect((input.element as HTMLInputElement).click).toHaveBeenCalled();
  });
}); 