<script setup lang="ts">
import { PropType, computed, defineAsyncComponent } from 'vue';
import { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import { VTabs, VTabsContent, VTabsList, VTabsTrigger } from 'UiKit/components/Base/VTabs';
import VTableDocuments from 'InvestCommon/shared/components/VTableDocuments.vue';
import { useOffersDetailsContent } from './logic/useOffersDetailsContent';
import { navigateWithQueryParams } from 'InvestCommon/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { useRoute } from 'vitepress';
import OffersComments from './OffersComments.vue';

// const OffersComments = defineAsyncComponent({
//   loader: () => import('./OffersComments.vue'),
// });

const VButton = defineAsyncComponent({
  loader: () => import('UiKit/components/Base/VButton/VButton.vue'),
});

const props = defineProps({
  offer: {
    type: Object as PropType<IOfferFormatted>,
    required: true,
  },
  loading: Boolean,
});

const offerRef = computed(() => props.offer);
const {
  userLoggedIn,
  filesFormatted,
  folders,
  tableHeader,
  isFilesLoading,
  parsedDescription,
  parsedHighlights,
  tabOptions,
} = useOffersDetailsContent(offerRef);

const route = useRoute();
const signInHandler = () => {
  const redirect = `${route.path}${window.location.search}${window.location.hash}`;
  navigateWithQueryParams(urlSignin, { redirect });
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
        <template
          v-if="tab.subTitle"
          #subtitle
        >
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
      <OffersComments
        :offer-id="offer.id"
        :offer-name="offer.name"
        :loading="loading"
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
