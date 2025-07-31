<script setup lang="ts">
import VTimeline from 'UiKit/components/Base/VTimeline/VTimeline.vue';
import VTimelineItem from 'UiKit/components/Base/VTimeline/VTimelineItem.vue';
import VTimelineCard from 'UiKit/components/Base/VTimeline/VTimelineCard.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useInvestmentTimeline } from './logic/useInvestmentTimeline';

const { data, getButtonTag, selectedUserProfileId, tokenState } = useInvestmentTimeline();
</script>

<template>
  <div class="InvestmentTimeline investment-timeline">
    <h1 class="investment-timeline__title is--h2__title">
      Investment Timeline
    </h1>

    <VTimeline
      class="investment-timeline__timeline"
      :content-style-default="false"
    >
      <VTimelineItem
        v-for="(dataItem, index) in data"
        :key="index"
        :circle-type="dataItem.circleType"
        :title="dataItem.title"
        class="investment-timeline__timeline-item"
      >
        <VTimelineCard
          v-for="(item, i) in dataItem.items"
          :key="i"
          :title="item.title"
          :duration="item.duration"
          :variant="item.variant"
          :type="item.type"
        >
          <div class="investment-timeline__timeline-text">
            <p
              class="investment-timeline__text"
              v-html="item.text"
            />
            <VButton
              v-if="item.buttonText && item.showButton"
              :as="getButtonTag(item)"
              :to="item.buttonRoute ? { name: item.buttonRoute, params: { profileId: selectedUserProfileId } } : null"
              :href="item.buttonHref"
              :loading="tokenState.loading"
              class="investment-timeline__timeline-button"
              @click.stop="dataItem.onButtonClick"
            >
              {{ item.buttonText }}
            </VButton>
          </div>
        </VTimelineCard>
      </VTimelineItem>
    </VTimeline>
  </div>
</template>

<style lang="scss">
.investment-timeline {
  $root: &;

  &__title {
    color: $black;
    margin-bottom: 24px;
  }

  &__timeline-text {
    display: flex;
    gap: 20px;
    align-items: center;
    width: 100%;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__timeline-button {
    flex-shrink: 0;
  }

  &__timeline {
    max-width: 850px;
  }

  &__text {
    width: 100%;
  }
}
</style>
