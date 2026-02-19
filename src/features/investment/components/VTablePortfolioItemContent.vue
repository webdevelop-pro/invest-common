<script setup lang="ts">
import {
  PropType, computed, watch,
} from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { ROUTE_INVESTMENT_DOCUMENTS, ROUTE_INVESTMENT_TIMELINE } from 'InvestCommon/domain/config/enums/routes';
import { useRoute, useRouter } from 'vue-router';
import file from 'UiKit/assets/images/file.svg';
import timeline from 'UiKit/assets/images/timeline.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import VTooltip from 'UiKit/components/VTooltip.vue';

const props = defineProps({
  item: {
    type: Object as PropType<IInvestmentFormatted>,
    required: true,
  },
  colspan: Number,
  loading: Boolean,
});

const emit = defineEmits(['onCancelInvestmentClick']);

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
const router = useRouter();
const route = useRoute();

const queryPopupCancelInvestment = computed(() => route.query.popup === 'cancel');
const documentsLink = computed(() => ({
  name: ROUTE_INVESTMENT_DOCUMENTS,
  params: { profileId: selectedUserProfileId.value, id: props.item.id },
  query: { 'document-tab': 'Investment-agreements' },
}));

const onTimelineClick = () => {
  router.push({
    name: ROUTE_INVESTMENT_TIMELINE,
    params: { profileId: selectedUserProfileId.value, id: props.item.id },
  });
};

const onCancelInvestmentClick = () => {
  emit('onCancelInvestmentClick');
};

// Simplified watch with immediate execution
watch(queryPopupCancelInvestment, (shouldShow) => {
  if (shouldShow) {
    setTimeout(onCancelInvestmentClick, 400);
  }
}, { immediate: true });

// Info data structure for cleaner rendering
const infoData = computed(() => [
  {
    labels: ['Number of Shares:', 'Price per Share:'],
    values: [props.item?.numberOfSharesFormatted, props.item?.pricePerShareFormatted],
    tooltips: [null, null],
  },
  {
    labels: ['Security Type:', 'Close Date:'],
    values: [props.item?.offer?.securityTypeFormatted, props.item?.offer?.closeAtFormatted],
    tooltips: [null, 'Closing offer date may vary depending on factors such as property type, financing conditions, buyer readiness, or legal requirements.'],
  },
]);
</script>

<template>
  <VTableRow class="VTableItemContent v-table-item-content">
    <VTableCell :colspan="colspan">
      <div class="v-table-item-content__cell">
        <!-- Documents Section -->
        <div class="v-table-item-content__documents">
          <VSkeleton
            v-if="loading"
            height="32px"
            width="180px"
            class="v-table-item-content__skeleton"
          />
          <VButton
            v-else
            as="router-link"
            :to="documentsLink"
            size="small"
            variant="outlined"
            color="secondary"
            icon-placement="left"
            class="v-table-item-content__document-button"
          >
            <file
              alt="file icon"
              class="v-table-item-content__document-icon"
            />
            <span class="v-table-item-content__document-text">Investment Documents</span>
          </VButton>
        </div>

        <!-- Info Section -->
        <div class="v-table-item-content__info">
          <div
            v-for="(section, sectionIndex) in infoData"
            :key="sectionIndex"
            class="v-table-item-content__info-column"
          >
            <div class="v-table-item-content__info-col">
              <span
                v-for="label in section.labels"
                :key="label"
                class="v-table-item-content__text is--h6__title"
              >
                {{ label }}
              </span>
            </div>
            <div class="v-table-item-content__info-col">
              <template
                v-for="(value, index) in section.values"
                :key="value"
              >
                <VSkeleton
                  v-if="loading"
                  height="18px"
                  width="50px"
                  class="v-table-item-content__skeleton"
                />
                <VTooltip
                  v-else-if="section.tooltips[index]"
                >
                  <span
                    class="v-table-item-content__value is--body"
                  >
                    {{ value }}
                  </span>
                  <template #content>
                    {{ section.tooltips[index] }}
                  </template>
                </VTooltip>
                <span
                  v-else
                  class="v-table-item-content__value is--body"
                >
                  {{ value }}
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="v-table-item-content__actions">
          <button
            class="v-table-item-content__timeline is--link-regular"
            @click.stop="onTimelineClick"
          >
            <timeline
              alt="investment timeline link icon"
              class="v-table-item-content__timeline-icon"
            />
            Investment Timeline
          </button>
          <VButton
            size="small"
            variant="link"
            color="red"
            class="v-table-item-content__cancel"
            @click.stop="onCancelInvestmentClick"
          >
            Cancel Investment
          </VButton>
        </div>
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_transitions.scss' as *;

.v-table-item-content {
  background-color: $gray-10;

  &.is--open {
    animation: slideDown 0.3s ease;
  }
  
  &:not(.is--open) {
    animation: slideUp 0.3s ease;
  }

  &__cell {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media screen and (width < $tablet){
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  &__documents {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;
    width: 32%;
    padding-left: 52px;

    @media screen and (width < $tablet){
      padding-left: 0;
      width: 100%;
      order: 2;
    }
  }

  &__info {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 40px;

    @media screen and (width < $tablet){
      grid-template-columns: repeat(1, minmax(0, 1fr));
      order: 1;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    gap: 8px;
    width: 20%;

    @media screen and (width < $tablet){
      width: 100%;
      align-items: flex-start;
      order: 3;
    }
  }

  &__skeleton {
    display: inline-block;
  }

  &__cancel {
    border: none !important;
    display: flex !important;
  }

  &__document-button {
    display: flex !important;
  }

  &__timeline {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__text {
    color: $gray-70;
    padding: 2px 0;
  }

  &__value {
    color: $gray-80;
    text-align: start;
    width: 100%;
    display: inline-block;
  }

  &__document-text {
    font-weight: 700;
  }

  &__info-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__info-column {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 218px;
  }

  &__document-icon {
    width: 15px;
  }

  &__timeline-icon {
    width: 20px;
  }
}
</style>
