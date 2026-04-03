import { ref } from 'vue';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('InvestCommon/config/env', () => ({
  default: {
    FILER_URL: 'https://filer.example.com',
  },
}));

import {
  buildPublicFilerImageSource,
  buildPublicFilerImageSrcset,
  getPublicFilerWidthDescriptor,
} from 'InvestCommon/data/filer/publicImage';
import { usePublicFilerImage } from 'InvestCommon/shared/composables/usePublicFilerImage';

describe('usePublicFilerImage', () => {
  it('builds public filer width descriptors from the provided metadata dimensions', () => {
    expect(getPublicFilerWidthDescriptor('311x183')).toBe(207);
    expect(getPublicFilerWidthDescriptor('484x290')).toBe(323);
    expect(getPublicFilerWidthDescriptor('1024x614')).toBe(683);
  });

  it('builds a srcset string with width descriptors for the public filer image sizes', () => {
    expect(buildPublicFilerImageSrcset(42)).toBe(
      [
        'https://filer.example.com/public/files/42?size=small 207w',
        'https://filer.example.com/public/files/42?size=medium 323w',
        'https://filer.example.com/public/files/42?size=big 683w',
      ].join(', '),
    );
  });

  it('returns reactive src, srcset, and sizes values', () => {
    const fileId = ref<number | undefined>(42);
    const fallbackSrc = ref('/fallback.svg');
    const sizes = ref('(max-width: 767px) 100vw, 484px');

    const image = usePublicFilerImage({
      fileId,
      fallbackSrc,
      sizes,
    });

    expect(image.src.value).toBe('https://filer.example.com/public/files/42?size=medium');
    expect(image.srcset.value).toContain('https://filer.example.com/public/files/42?size=small 207w');
    expect(image.sizes.value).toBe('(max-width: 767px) 100vw, 484px');

    fileId.value = undefined;

    expect(image.src.value).toBe('/fallback.svg');
    expect(image.srcset.value).toBe('');
  });

  it('applies shared preset defaults in one place', () => {
    const image = usePublicFilerImage({
      fileId: 42,
      preset: 'offerCard',
    });

    expect(image.src.value).toBe('https://filer.example.com/public/files/42?size=medium');
    expect(image.srcset.value).toContain('https://filer.example.com/public/files/42?size=big 683w');
    expect(image.sizes.value).toBe('(max-width: 767px) calc(100vw - 30px), (max-width: 1280px) 46vw, 400px');
  });

  it('falls back to a provided source when no filer image id is available', () => {
    expect(buildPublicFilerImageSource(undefined, {
      fallbackSrc: '/fallback.svg',
    })).toBe('/fallback.svg');
  });
});
