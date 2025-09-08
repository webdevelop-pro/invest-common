import { computed, type Ref } from 'vue';
import { useData } from 'vitepress';
import env from 'InvestCommon/domain/config/env';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { storeToRefs } from 'pinia';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import {
  urlHome, urlOffers, 
} from 'InvestCommon/domain/config/links';
import { socials } from 'UiKit/utils/socials';

const { FILER_URL } = env;

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
  const videoSrc = computed(() => offerRef.value?.data?.video);
  const imageID = computed(() => offerRef.value?.image_link_id as number | undefined);
  const documentsMedia = computed(() => filesData.value?.entities?.media?.entities || {});
  const documentsMediaArray = computed(() => Object.values(documentsMedia.value) || []);
  const documentsMediaFormatted = computed(() => documentsMediaArray.value?.map((item: any) => {
    if (item?.url) return { image: item?.url } as { image: string };
    return null;
  }).filter(Boolean) || []);

  const carouselFiles = computed(() => {
    const array: Array<{ image?: string; video?: string; thumb?: string }> = [...documentsMediaFormatted.value];
    if (videoSrc.value) array.unshift({ video: videoSrc.value });
    if (!(array.length === 1 && !!videoSrc.value) && (imageID.value && imageID.value > 0)) {
      array.push({ image: `${FILER_URL}/public/files/${imageID.value}?size=big`, thumb: `${FILER_URL}/public/files/${imageID.value}?size=small` });
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
  };
}


