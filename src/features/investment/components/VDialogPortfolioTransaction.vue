<script setup lang="ts">
import { PropType, computed } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import {
  VDialogContent, VDialogFooter, VDialogTitle, VDialog,
  VDialogHeader,
} from 'UiKit/components/Base/VDialog';
import VTablePortfolioTransaction from 'InvestCommon/features/investment/components/VTablePortfolioTransaction.vue';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';

const props = defineProps({
  investment: {
    type: Object as PropType<IInvestmentFormatted>,
    required: true,
  },
  userName: String,
});
const open = defineModel<boolean>();

const dialogsStore = useDialogs();

const title = computed(() => {
  if (props.investment?.funding_type?.toLowerCase() === 'ach') return 'ACH Transaction';
  if (props.investment?.funding_type?.toLowerCase() === 'wallet') return 'Wallet Transaction';
  return 'Transaction';
});

const onContactUsClick = async () => {
  open.value = false;
  dialogsStore.openContactUsDialog('investment');
};
</script>

<template>
  <VDialog
    v-model:open="open"
    :query-key="`popup-${investment?.id}`"
    query-value="transaction"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="v-dialog-portfolio-transaction"
    >
      <div>
        <VDialogHeader>
          <VDialogTitle class="v-dialog-portfolio-transaction__title">
            {{ title }}
          </VDialogTitle>
        </VDialogHeader>
        <div class="v-dialog-portfolio-transaction__text">
          <VTablePortfolioTransaction
            :investment="investment"
          />
        </div>
      </div>
      <VDialogFooter>
        <div class="v-dialog-portfolio-transaction__footer-btns">
          <VButton
            variant="outlined"
            data-testid="button"
            @click="onContactUsClick"
          >
            Contact Us
          </VButton>
        </div>
      </VDialogFooter>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-dialog-portfolio-transaction {
  @media screen and (max-width: $tablet){
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

  &__title {
    margin-bottom: 20px;
  }

  &__text {
    color: $gray-80;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;
    align-self: stretch;
  }

  &__footer-btns {
    display: flex;
    padding-top: 40px;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    padding-bottom: 15px;
  }
}
</style>
