import {
  computed,
  toValue,
  type MaybeRefOrGetter,
} from 'vue';
import {
  buildPublicFilerImageSource,
  buildPublicFilerImageSrcset,
  type BuildPublicFilerImageSrcsetOptions,
  type PublicFilerImageSize,
} from 'InvestCommon/data/filer/publicImage';

export interface PublicFilerImagePresetOptions {
  preferredSize?: PublicFilerImageSize;
  requestedSizes?: BuildPublicFilerImageSrcsetOptions['requestedSizes'];
  sizes?: string;
}

export const PUBLIC_FILER_IMAGE_PRESETS = {
  offerCard: {
    preferredSize: 'medium',
    sizes: '(max-width: 767px) calc(100vw - 30px), (max-width: 1280px) 46vw, 400px',
  },
  investmentTopInfo: {
    preferredSize: 'medium',
    sizes: '(max-width: 1024px) 100vw, 361px',
  },
  investmentTableItemHeaderMobile: {
    preferredSize: 'medium',
    sizes: '100vw',
  },
  offerCarouselMain: {
    preferredSize: 'big',
    sizes: '(max-width: 1024px) 100vw, 66vw',
  },
  offerCarouselThumb: {
    preferredSize: 'small',
    sizes: '150px',
  },
} satisfies Record<string, PublicFilerImagePresetOptions>;

export type PublicFilerImagePreset = keyof typeof PUBLIC_FILER_IMAGE_PRESETS;

export interface UsePublicFilerImageOptions {
  fileId?: MaybeRefOrGetter<number | string | null | undefined>;
  dimensions?: MaybeRefOrGetter<BuildPublicFilerImageSrcsetOptions['dimensions'] | undefined>;
  preset?: MaybeRefOrGetter<PublicFilerImagePreset | undefined>;
  preferredSize?: MaybeRefOrGetter<PublicFilerImageSize | undefined>;
  requestedSizes?: MaybeRefOrGetter<PublicFilerImageSize[] | undefined>;
  sizes?: MaybeRefOrGetter<string | undefined>;
  fallbackSrc?: MaybeRefOrGetter<string | undefined>;
  widthDivisor?: MaybeRefOrGetter<number | undefined>;
}

export function usePublicFilerImage({
  fileId,
  dimensions,
  preset,
  preferredSize,
  requestedSizes,
  sizes,
  fallbackSrc,
  widthDivisor,
}: UsePublicFilerImageOptions = {}) {
  const presetOptions = computed(() => {
    const presetKey = toValue(preset);

    return presetKey ? PUBLIC_FILER_IMAGE_PRESETS[presetKey] : undefined;
  });

  const preferredSizeValue = computed(() => (
    toValue(preferredSize) ?? presetOptions.value?.preferredSize ?? 'medium'
  ));

  const requestedSizesValue = computed(() => (
    toValue(requestedSizes) ?? presetOptions.value?.requestedSizes
  ));

  const sizesValue = computed(() => (
    toValue(sizes) ?? presetOptions.value?.sizes
  ));

  const src = computed(() => buildPublicFilerImageSource(toValue(fileId), {
    fallbackSrc: toValue(fallbackSrc),
    preferredSize: preferredSizeValue.value,
  }));

  const srcset = computed(() => buildPublicFilerImageSrcset(toValue(fileId), {
    dimensions: toValue(dimensions),
    requestedSizes: requestedSizesValue.value,
    widthDivisor: toValue(widthDivisor),
  }));

  return {
    src,
    srcset,
    sizes: sizesValue,
  };
}
