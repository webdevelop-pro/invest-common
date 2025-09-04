import { computed, type Ref } from 'vue';
import { useData } from 'vitepress';
import env from 'InvestCommon/domain/config/env';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { storeToRefs } from 'pinia';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import {
  urlHome, urlOffers, 
} from 'InvestCommon/domain/config/links';
import linkedinIcon from 'UiKit/assets/social/linkedin.svg?component';
import facebookIcon from 'UiKit/assets/social/facebook.svg?component';
import instagramIcon from 'UiKit/assets/social/instagram.svg?component';
import xIcon from 'UiKit/assets/social/x-twitter.svg?component';
import githubIcon from 'UiKit/assets/social/github.svg?component';
import telegramIcon from 'UiKit/assets/social/telegram.svg?component';

const { FILER_URL } = env;

// Social media configuration
const socialMediaConfig = {
  linkedin: {
    icon: linkedinIcon,
    iconName: 'linkedin',
    name: 'LinkedIn',
  },
  facebook: {
    icon: facebookIcon,
    iconName: 'facebook',
    name: 'Facebook',
  },
  twitter: {
    icon: xIcon,
    iconName: 'twitter',
    name: 'Twitter',
  },
  github: {
    icon: githubIcon,
    iconName: 'github',
    name: 'GitHub',
  },
  instagram: {
    icon: instagramIcon,
    iconName: 'instagram',
    name: 'Instagram',
  },
  telegram: {
    icon: telegramIcon,
    iconName: 'telegram',
    name: 'Telegram',
  },
};

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
    
    return Object.entries(socialMediaConfig)
      .filter(([key]) => offerRef.value?.[key as keyof typeof offerRef.value])
      .map(([key, config]) => ({
        ...config,
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


