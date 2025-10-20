<script setup lang="ts">
import { computed } from 'vue';
import { VCard, VCardContent, VCardHeader, VCardTitle } from 'UiKit/components/Base/VCard';
import VProgress from 'UiKit/components/Base/VProgress/VProgress.vue';
import { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { urlOfferSingle } from 'InvestCommon/domain/config/links';

export interface OfferCardProps {
  offer: IOfferFormatted;
}

const props = defineProps<OfferCardProps>();

const progressPercentage = computed(() => props.offer?.offerFundedPercent || 0);
</script>

<template>
  <VCard
    :href="urlOfferSingle(offer.slug)"
    :aria-label="offer?.name"
    class="VCardOfferFunded v-card-offer-funded is--card"
  >
    <VCardHeader v-if="offer?.title">
      <VCardTitle class="v-card-offer-funded__title">
        <div class="v-card-offer-funded__title-content">
          <VImage
            v-if="offer?.imageSmall"
            :src="offer.imageSmall"
            :alt="offer.name"
            class="v-card-offer-funded__icon"
          />
          <span>{{ offer.name }}</span>
        </div>
      </VCardTitle>
    </VCardHeader>
    
    <VCardContent class="v-card-offer-funded__content">
      <VProgress
        :model-value="progressPercentage"
        with-text
      >
        <template #top-start>
          <span class=" is--h5__title is--color-secondary-dark">
              
            {{ progressPercentage }}% Funded
          </span>
        </template>
        <template #top-end>
          <span class=" is--h5__title is--color-secondary-dark">
            {{ offer.closeAtFormatted }}
          </span>
        </template>
      </VProgress>
    </VCardContent>
  </VCard>
</template>

<style lang="scss">
.v-card-offer-funded {
  flex-direction: column;
  padding: 20px;
  justify-content: space-between;

  &:hover {
    box-shadow: $box-shadow-large;
  }

  &__title-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    object-fit: cover;
    flex-shrink: 0;
  }
}
</style>
