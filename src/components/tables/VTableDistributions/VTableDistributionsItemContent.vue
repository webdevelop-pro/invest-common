<script setup lang="ts">
import { currency } from 'InvestCommon/helpers/currency';
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { PropType } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import file from 'UiKit/assets/images/file.svg';
import { IDistributionsData } from 'InvestCommon/types/api/distributions';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';

defineProps({
  item: {
    type: Object as PropType<IDistributionsData>,
    required: true,
  },
  isLoading: Boolean,
  colspan: Number,
});
</script>

<template>
  <VTableRow class="VTableDistributionsItemContent v-table-distributions-content">
    <VTableCell
      :colspan="colspan"
    >
      <div class="v-table-item-content__cell">
        <div class="v-table-distributions-content__documents">
          <VSkeleton
            v-if="isLoading"
            height="32px"
            width="180px"
            class="v-table-distributions-content__skeleton"
          />
          <template v-else>
            <VButton
              v-for="doc in item.documents"
              :key="doc.id"
              as="a"
              target="_blank"
              rel="noopener noreferrer"
              :href="doc.url"
              size="small"
              variant="outlined"
              color="secondary"
              icon-placement="left"
              class="v-table-distributions-content__document-button"
            >
              <file
                alt="file icon"
                class="v-table-distributions-content__document-icon"
              />
              <span class="v-table-distributions-content__document-text">{{ doc.name }}</span>
            </VButton>
          </template>
        </div>
        <div class="v-table-distributions-content__info">
          <div class="v-table-distributions-content__info-column">
            <div class="v-table-distributions-content__info-col">
              <span class="v-table-distributions-content__text is--h6__title">
                Total Amount:
              </span>
              <span class="v-table-distributions-content__text is--h6__title">
                Current Year:
              </span>
            </div>
            <div class="v-table-distributions-content__info-col">
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-distributions-content__skeleton"
              />
              <span
                v-else
                class="v-table-distributions-content__value is--body"
              >
                {{ currency(item?.total_amount) }}
              </span>
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-distributions-content__skeleton"
              />
              <span
                v-else
                class="v-table-distributions-content__value is--body"
              >
                {{ currency(item?.amount) }}
              </span>
            </div>
          </div>
          <div class="v-table-distributions-content__info-column">
            <div class="v-table-distributions-content__info-col">
              <span class="v-table-distributions-content__text is--h6__title">
                Transaction Status:
              </span>
              <span class="v-table-distributions-content__text is--h6__title">
                Distribution Date:
              </span>
            </div>
            <div class="v-table-distributions-content__info-col">
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-distributions-content__skeleton"
              />
              <span
                v-else
                class="v-table-distributions-content__value is--body"
              >
                {{ item?.status }}
              </span>
              <VSkeleton
                v-if="isLoading"
                height="18px"
                width="50px"
                class="v-table-distributions-content__skeleton"
              />
              <span
                v-else
                class="v-table-distributions-content__value is--body"
              >
                {{ formatToFullDate(new Date(item.created_at).toISOString()) }}
              </span>
            </div>
          </div>
        </div>
        <div class="v-table-distributions-content__actions" />
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_transitions.scss' as *;
.v-table-distributions-content {
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
