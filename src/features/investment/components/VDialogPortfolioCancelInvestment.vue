<script setup lang="ts">
import {
  PropType, type Ref,
} from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { PostLinkTypes } from 'InvestCommon/types/api/blog';
import VFormTextarea from 'UiKit/components/Base/VForm/VFormTextarea.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import { urlContactUs, urlBlogSingle } from 'InvestCommon/domain/config/links';
import VDialogContent from 'UiKit/components/Base/VDialog/VDialogContent.vue';
import VDialogFooter from 'UiKit/components/Base/VDialog/VDialogFooter.vue';
import VDialog from 'UiKit/components/Base/VDialog/VDialog.vue';
import VDialogTitle from 'UiKit/components/Base/VDialog/VDialogTitle.vue';
import VDialogHeader from 'UiKit/components/Base/VDialog/VDialogHeader.vue';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { usePortfolioCancelInvestment } from './logic/usePortfolioCancelInvestment';

const props = defineProps({
  investment: {
    type: Object as PropType<IInvestmentFormatted>,
    required: true,
  },
  userName: String,
});
const emit = defineEmits(['close']);
const open = defineModel<boolean>();

const {
  model, errorData, isBtnDisabled,
  cancelInvestState, cancelInvestHandler,
  onBackClick, isFieldRequired, getErrorText,
} = usePortfolioCancelInvestment(props.investment, open as Ref<boolean>, emit);
</script>

<template>
  <VDialog
    v-model:open="open"
    :query-key="`popup-${investment?.id}`"
    query-value="cancel"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="VDialogPortfolioCancelInvestment v-dialog-cancel-investment"
    >
      <div>
        <VDialogHeader>
          <VDialogTitle class="v-dialog-cancel-investment__title">
            Cancel Investment
          </VDialogTitle>
        </VDialogHeader>
        <div class="v-dialog-cancel-investment__text">
          <p class="v-dialog-cancel-investment__text is--body">
            You are about to cancel your investment
            <strong>#{{ investment?.id }}</strong> in <strong>{{ investment?.offer?.name }}</strong>.
            Your funds, {{ investment.amountFormatted }} will be send back to the funding
            source wire of individual profile. In case if you want to get more information, please take a
            look
            <a
              :href="urlBlogSingle(PostLinkTypes.cancelInvestment)"
              target="_blank"
              rel="noopener noreferrer"
              class="is--link-1"
            >
              Can I cancel my investment and get a refund
            </a> article or
            <a
              :href="urlContactUs"
              target="_blank"
              rel="noopener noreferrer"
              class="is--link-1"
            >
              Contact us
            </a>
            with any question.
          </p>
          <VFormGroup
            v-slot="VFormGroupProps"
            class="accreditation-file-input__note"
            :required="isFieldRequired('cancelation_reason')"
            :error-text="getErrorText('cancelation_reason', errorData)"
            label="Please let us know your cancellation reason"
            data-testid="cancellation-reason-group"
          >
            <VFormTextarea
              :model-value="model.cancelation_reason"
              rows="3"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Cancellation Reason"
              data-testid="cancellation-reason"
              @update:model-value="model.cancelation_reason = $event"
            />
          </VFormGroup>
        </div>
      </div>
      <VDialogFooter>
        <div class="v-dialog-cancel-investment__footer-btns">
          <VButton
            variant="link"
            @click.stop="onBackClick"
          >
            <arrowLeft
              alt="arrow left"
              class="v-dialog-cancel-investment__back-icon"
            />
            Back
          </VButton>
          <VButton
            color="red"
            :loading="cancelInvestState.loading"
            :disabled="isBtnDisabled"
            @click.stop="cancelInvestHandler"
          >
            Cancel Investment
          </VButton>
        </div>
      </VDialogFooter>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.v-dialog-cancel-investment {
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
    margin-bottom: 20px;
  }

  &__footer-btns {
    display: flex;
    padding-top: 10px;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    padding-bottom: 10px;
    @media screen and (max-width: $tablet){
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__back-icon {
    width: 20px;
  }
}
</style>
