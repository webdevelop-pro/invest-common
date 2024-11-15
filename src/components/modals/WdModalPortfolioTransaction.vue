<script setup lang="ts">
import { PropType, computed } from 'vue';
import VModalLayout from 'UiKit/components/VModal/VModalLayout.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { IInvest } from 'InvestCommon/types/api/invest';
import VTable from 'UiKit/components/VTable/VTable.vue';
import VTag from 'UiKit/components/VTag/VTag.vue';
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { currency } from 'InvestCommon/helpers/currency';
import { InvestTransactionStatuses } from 'InvestCommon/helpers/enums/invest';
import { urlContactUs } from 'InvestCommon/global/links';

const props = defineProps({
  investment: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  userName: String,
});
defineEmits(['close']);

const title = computed(() => {
  if (props.investment.funding_type.toLowerCase() === 'ach') return 'ACH Transaction';
  if (props.investment.funding_type.toLowerCase() === 'wallet') return 'Wallet Transaction';
  return 'Transaction';
});
const dateFull = computed(() => {
  let dateInner = props.investment.payment_data.created_at;
  if (props.investment.payment_data.updated_at) dateInner = props.investment.payment_data.updated_at;
  return dateInner;
});
const getTimeFormat = (fullDate: string) => {
  const date = new Date(fullDate);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
const dateFormatted = computed(() => (dateFull.value ? formatToFullDate(new Date(dateFull.value).toISOString()) : ''));
const timeFormatted = computed(() => (dateFull.value ? getTimeFormat(String(dateFull.value)) : ''));
</script>

<template>
  <VModalLayout
    class="wd-modal-portfolio-transaction is--no-margin"
    @close="$emit('close')"
  >
    <template #default>
      <div
        id="download-content"
        ref="DownloadComp"
        class="wd-modal-portfolio-transaction__text"
      >
        <div class="wd-modal-portfolio-transaction__title is--h3__title">
          {{ title }}
        </div>
        <VTable
          size="small"
        >
          <tbody>
            <tr>
              <td class="wd-modal-portfolio-transaction__date-wrap">
                <div class="wd-modal-portfolio-transaction__date is--small">
                  {{ dateFormatted }}
                </div>
                <div class="wd-modal-portfolio-transaction__time is--small">
                  {{ timeFormatted }}
                </div>
              </td>
              <td class="wd-modal-portfolio-transaction__type-wrap">
                <div class="wd-modal-portfolio-transaction__type">
                  <VTag
                    round
                    size="small"
                    background="#F8F5FF"
                    class="profile-status-info__tag"
                  >
                    Investment
                  </VTag>
                </div>
              </td>
              <td class="wd-modal-portfolio-transaction__status-wrap">
                <div class="wd-modal-portfolio-transaction__status is--small">
                  {{ InvestTransactionStatuses[investment.funding_status]?.text }}
                </div>
              </td>
              <td class="wd-modal-portfolio-transaction__amount-wrap">
                <div class="wd-modal-portfolio-transaction__amount is--h6__title">
                  {{ currency(Number(investment.amount), 0) }}
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </template>

    <template #footer>
      <div class="wd-modal-portfolio-transaction__footer-btns">
        <VButton
          tag="a"
          :href="urlContactUs"
          variant="outlined"
          data-testid="button"
        >
          Contact Us
        </VButton>
      </div>
    </template>
  </VModalLayout>
</template>

<style lang="scss">
.wd-modal-portfolio-transaction {
  width: 700px !important;

  &__title {
    margin-top: 32px;
    margin-bottom: 10px;
  }

  &__text {
    color: $gray-80;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;
    align-self: stretch;
    margin-left: 12px;
  }

  &__footer-btns {
    display: flex;
    padding-top: 30px;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    padding-bottom: 15px;
  }

  &__date {
    color: $gray-80;
  }

  &__time {
    color: $gray-60;
  }

  &__status {
    color: $gray-80;
  }

  &__amount {
    color: $black;
    text-align: right;
  }

  &__type {
    display: flex;
  }

  &__amount-wrap {
    width: 32%;
  }

  &__status-wrap {
    width: 20%;
  }

  &__type-wrap {
    width: 21%;
  }

  &__date-wrap {
    width: 20%;
  }
}
</style>
