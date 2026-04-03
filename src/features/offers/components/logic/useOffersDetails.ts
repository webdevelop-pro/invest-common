import { computed, type Ref } from 'vue';
import { useData } from 'vitepress';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { buildPublicFilerImageUrl } from 'InvestCommon/data/filer/publicImage';
import { usePublicFilerImage } from 'InvestCommon/shared/composables/usePublicFilerImage';
import { storeToRefs } from 'pinia';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import {
  urlHome, urlOffers, 
} from 'InvestCommon/domain/config/links';
import { socials } from 'UiKit/utils/socials';

export function useOffersDetails(offerRef: Ref<IOfferFormatted | undefined>) {
  const { frontmatter } = useData();

  const breadcrumbsList = computed(() => [
    {
      text: 'Home',
      href: urlHome,
    },
    {
      text: 'Explore',
      href: urlOffers,
    },
    {
      text: offerRef.value?.name || 'Offer Details',
    },
  ]);

  const tags = [
    'Fintech',
    'E-Commerce',
    'Network Security',
  ];

  const filerRepository = useRepositoryFiler();
  const { getPublicFilesState } = storeToRefs(filerRepository);

  const filesData = computed(() => getPublicFilesState.value.data);
  const filesLoading = computed(() => getPublicFilesState.value.loading);
  const videoSrc = computed(() => offerRef.value?.data?.video);
  const imageID = computed(() => offerRef.value?.image_link_id as number | undefined);
  const {
    src: offerMainImageSrc,
    srcset: offerMainImageSrcset,
    sizes: offerMainImageSizes,
  } = usePublicFilerImage({
    fileId: imageID,
    fallbackSrc: computed(() => offerRef.value?.imageBig),
    preset: 'offerCarouselMain',
  });
  const {
    src: offerThumbSrc,
    srcset: offerThumbSrcset,
    sizes: offerThumbSizes,
  } = usePublicFilerImage({
    fileId: imageID,
    fallbackSrc: computed(() => offerRef.value?.imageSmall),
    preset: 'offerCarouselThumb',
  });
  const documentsMedia = computed(() => filesData.value?.entities?.media?.entities || {});
  const documentsMediaArray = computed(() => Object.values(documentsMedia.value) || []);
  const documentsMediaFormatted = computed(() => documentsMediaArray.value?.map((item: any) => {
    if (item?.url) return { image: item?.url } as { image: string };
    return null;
  }).filter(Boolean) || []);

  const carouselFiles = computed(() => {
    const array: Array<{
      image?: string;
      video?: string;
      thumb?: string;
      srcset?: string;
      sizes?: string;
      thumbSrcset?: string;
      thumbSizes?: string;
    }> = [...documentsMediaFormatted.value];
    if (videoSrc.value) array.unshift({ video: videoSrc.value });
    if (!(array.length === 1 && !!videoSrc.value) && (imageID.value && imageID.value > 0)) {
      array.push({
        image: offerMainImageSrc.value || buildPublicFilerImageUrl(imageID.value, 'big'),
        thumb: offerThumbSrc.value || buildPublicFilerImageUrl(imageID.value, 'small'),
        srcset: offerMainImageSrcset.value || undefined,
        sizes: offerMainImageSizes.value || undefined,
        thumbSrcset: offerThumbSrcset.value || undefined,
        thumbSizes: offerThumbSizes.value || undefined,
      });
    }
    return array;
  });

  // Social links computed property
  const socialLinks = computed(() => {
    if (!offerRef.value) return [];
    
    return Object.entries(socials)
      .filter(([key]) => offerRef.value?.[key as keyof typeof offerRef.value])
      .map(([key, config]) => ({
        icon: config.icon,
        iconName: config.iconName,
        name: config.name,
        href: offerRef.value?.[key as keyof typeof offerRef.value] as string,
      }));
  });

  return {
    frontmatter,
    breadcrumbsList,
    tags,
    carouselFiles,
    socialLinks,
    filesLoading,
  };
}
