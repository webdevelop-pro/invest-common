<script setup lang="ts">
import { PropType, computed, defineAsyncComponent } from 'vue';
import { marked } from 'marked';
import { IOffer } from 'InvestCommon/types/api/offers';
import { OfferTabTypes } from '../utils';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { urlSignin } from 'InvestCommon/global/links';
import {
  VTabs, VTabsContent, VTabsList, VTabsTrigger,
} from 'UiKit/components/Base/VTabs';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';
import VTableDocuments from 'InvestCommon/shared/components/VTableDocuments.vue';

const OffersComments = defineAsyncComponent({
  loader: () => import('./OffersComments.vue'),
});

const VButton = defineAsyncComponent({
  loader: () => import('UiKit/components/Base/VButton/VButton.vue'),
});
const VSkeleton = defineAsyncComponent({
  loader: () => import('UiKit/components/Base/VSkeleton/VSkeleton.vue'),
});

const props = defineProps({
  offer: {
    type: Object as PropType<IOffer>,
    required: true,
  },
  loading: Boolean,
});

const offerStore = useOfferStore();
const { getOfferCommentsData } = storeToRefs(offerStore);
const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);
const filerRepository = useRepositoryFiler();
const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);

const commentsLength = computed(() => (
  (getOfferCommentsData.value?.length && getOfferCommentsData.value?.length > 0)
    ? getOfferCommentsData.value?.length : null
));


const filesFormatted = computed(() => (
  FilerFormatter.getFormattedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)));

const folders = computed(() => FilerFormatter.getFolderedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data));
const tableHeader = [
  { text: 'Document Name', class: '' },
  { text: 'Type', class: '' },
  { text: 'Date Added', class: 'offer-details-content__date-header' },
];

const isFilesLoading = computed(() => (
  userLoggedIn.value ? getFilesState.value.loading : getPublicFilesState.value.loading));

// Function to clean image URLs in the HTML content
function cleanImageUrls(htmlContent: string): string {
  const regex = /(<img\s[^>]*src="[^"]+)(\?X-Goog-Algorithm[^"]*)(")/g;
  return htmlContent?.replace(regex, '$1$3');
}

const parsedDescription = computed(() => {
  if (!props.offer.description) return null;
  const parsed = marked.parse(props.offer.description);
  return cleanImageUrls(parsed);
});

const parsedHighlights = computed(() => {
  if (!props.offer.highlights) return null;
  const parsed = marked.parse(props.offer.highlights);
  return cleanImageUrls(parsed);
});

const tabOptions = computed(() => ([
  {
    value: OfferTabTypes.description,
    label: 'Description',
  },
  {
    value: OfferTabTypes.highlights,
    label: 'Highlights',
  },
  {
    value: OfferTabTypes.documents,
    label: 'Financial Documents',
  },
  {
    value: OfferTabTypes.comments,
    label: 'Ask a Question',
    subTitle: commentsLength.value,
  },
]));

const query = computed(() => (
  (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('redirect') : null));

const signInHandler = () => {
  navigateWithQueryParams(urlSignin, query.value);
};
</script>

<template>
  <VTabs
    tabs-to-url
    :default-value="tabOptions[0].value"
    class="OffersDetailsContent offer-details-content with-default-distance"
  >
    <VTabsList>
      <VTabsTrigger
        v-for="(tab, tabIndex) in tabOptions"
        :key="tabIndex"
        :value="tab.value"
      >
        {{ tab.label }}
        <template v-if="tab.subTitle" #subtitle>
          {{ tab.subTitle }}
        </template>
      </VTabsTrigger>
    </VTabsList>

    <VTabsContent
      :value="tabOptions[0].value"
      class="offer-details tab offer-details-content__description"
    >
      <div class="offer-details-content__title is--h2__title">
        Description
      </div>
      <p
        v-if="offer.description"
        itemprop="description"
        class="offer-details-content__description-text is--body"
        v-html="parsedDescription"
      />
    </VTabsContent>

    <VTabsContent
      :value="tabOptions[1].value"
      class="offer-highlights tab offer-details-content__highlights"
    >
      <div class="offer-details-content__title is--h2__title">
        Highlights
      </div>
      <p
        v-if="offer.highlights"
        class="offer-details-content__highlights-text is--body"
        v-html="parsedHighlights"
      />
    </VTabsContent>

    <VTabsContent
      :value="tabOptions[2].value"
      class="offer-documents tab offer-details-content__documents"
    >
      <div class="offer-details-content__title is--h2__title">
        Financial Documents
      </div>
      <VTableDocuments
        v-if="userLoggedIn"
        :files="filesFormatted"
        :folders="folders"
        :table-header="tableHeader"
        :loading-table="isFilesLoading"
      />
      <div
        v-else
        class="offer-details-content__signin-wrap"
      >
        <span class="is--body">
          Please sign in to be able to see documents
        </span>
        <VButton
          class="is--margin-top-0"
          @click="signInHandler"
        >
          Sign in
        </VButton>
      </div>
    </VTabsContent>
    <VTabsContent
      :value="tabOptions[3].value"
    >
      <VSkeleton
        v-if="loading"
        height="22px"
        width="100%"
      />
      <OffersComments
        v-else
        :offer-id="offer.id"
        :offer-name="offer.name"
      />
    </VTabsContent>
  </VTabs>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.offer-details-content {
  color: $black;

  @media screen and (min-width: $desktop){
    margin-bottom: 40px;
  }

  &__title {
    margin-bottom: 24px;
  }

  &__signin-wrap {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }

  &__date-header {
    width: 130px;
  }

  h1, h2, h3, h4, h5, h6 {
    color: $black;
  }
}
</style>
