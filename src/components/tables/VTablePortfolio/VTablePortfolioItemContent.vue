<script setup lang="ts">
import { currency } from 'InvestCommon/helpers/currency';
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { IInvest } from 'InvestCommon/types/api/invest';
import {
  PropType, computed, onBeforeMount, ref, watch,
} from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { ROUTE_INVESTMENT_DOCUMENTS, ROUTE_INVESTMENT_TIMELINE } from 'InvestCommon/helpers/enums/routes';
import { useRoute, useRouter } from 'vue-router';
import file from 'UiKit/assets/images/file.svg';
import timeline from 'UiKit/assets/images/timeline.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';

const useDialogsStore = useDialogs();

const props = defineProps({
  item: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  colspan: Number,
});

const investmentsStore = useInvestmentsStore();
const { isGetInvestOneLoading } = storeToRefs(investmentsStore);
const offersStore = useOfferStore();
const { isGetOfferOneLoading } = storeToRefs(offersStore);
const userStore = useUsersStore();
const { selectedUserProfileId } = storeToRefs(userStore);
const investData = ref<IInvest | null>(null);
const router = useRouter();
const route = useRoute();

const queryPopupCancelInvestment = computed(() => (route.query.popup === 'cancel'));

const isLoading = computed(() => (isGetInvestOneLoading.value || isGetOfferOneLoading.value));

const closedAt = computed(() => {
  if (new Date(props.item?.offer.close_at).getTime() < new Date('01-01-2022').getTime() || !props.item?.offer.close_at) return 'not closed';
  return formatToFullDate(new Date(props.item?.offer.close_at).toISOString());
});

const onTimelineClick = () => {
  void router.push({
    name: ROUTE_INVESTMENT_TIMELINE,
    params: { profileId: selectedUserProfileId.value, id: props.item.id },
  });
};
const onCancelInvestmentClick = () => {
  void useDialogsStore.showCancelInvestment(props.item);
};

onBeforeMount(async () => {
  if (props.item.id) {
    investData.value = await investmentsStore.getCombinedInvestAndOfferData(String(props.item.id));
  }
});

watch(() => [queryPopupCancelInvestment.value], () => {
  if (queryPopupCancelInvestment.value) {
    setTimeout(() => onCancelInvestmentClick(), 400);
  }
}, { immediate: true });
</script>

<template>
  <VTableRow class="VTableItemContent v-table-item-content">
    <VTableCell
      :colspan="colspan"
    >
      <div class="v-table-item-content__cell">
        <div class="v-table-item-content__documents">
          <VSkeleton
            v-if="isLoading"
            height="32px"
            width="180px"
            class="v-table-item-content__skeleton"
          />
          <template v-else>
            <VButton
              as="router-link"
              :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
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
          </template>
        </div>
        <div class="v-table-item-content__info">
          <div class="v-table-item-content__info-column">
            <div class="v-table-item-content__info-col">
              <span class="v-table-item-content__text is--h6__title">
                Number of Shares:
              </span>
              <span class="v-table-item-content__text is--h6__title">
                Price per Share:
              </span>
            </div>
            <div class="v-table-item-content__info-col">
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-item-content__skeleton"
              />
              <span
                v-else
                class="v-table-item-content__value is--body"
              >
                {{ investData?.number_of_shares.toLocaleString('en-US') }}
              </span>
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-item-content__skeleton"
              />
              <span
                v-else
                class="v-table-item-content__value is--body"
              >
                {{ currency(investData?.price_per_share) }}
              </span>
            </div>
          </div>
          <div class="v-table-item-content__info-column">
            <div class="v-table-item-content__info-col">
              <span class="v-table-item-content__text is--h6__title">
                Security Type:
              </span>
              <span class="v-table-item-content__text is--h6__title">
                Close Date:
              </span>
            </div>
            <div class="v-table-item-content__info-col">
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-item-content__skeleton"
              />
              <span
                v-else
                class="v-table-item-content__value is--body"
              >
                {{ investData?.offer.security_type ? item?.offer.security_type : '-' }}
              </span>
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-item-content__skeleton"
              />
              <span
                v-else
                class="v-table-item-content__value is--body"
              >
                {{ closedAt }}
              </span>
            </div>
          </div>
        </div>
        <div class="v-table-item-content__actions">
          <div
            class="v-table-item-content__timeline is--link-regular"
            @click.stop="onTimelineClick"
          >
            <timeline
              alt="investment timeline link icon"
              class="v-table-item-content__timeline-icon"
            />
            Investment Timeline
          </div>
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
  }

  &__documents {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;
    width: 32%;
    padding-left: 52px;
  }

  &__info {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 40px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    gap: 8px;
    width: 20%;
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

  &__info-item {
    align-self: center;
    min-width: 218px;
    display: flex;
    gap: 12px;
    align-items: center;
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
  }

  &__document-icon {
    width: 15px;
  }

  &__timeline-icon {
    width: 20px;
  }
}
</style>
