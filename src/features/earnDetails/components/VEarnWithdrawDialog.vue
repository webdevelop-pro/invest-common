<script setup lang="ts">
import { toRefs } from 'vue';
import VDialog from 'UiKit/components/Base/VDialog/VDialog.vue';
import VDialogContent from 'UiKit/components/Base/VDialog/VDialogContent.vue';
import VDialogHeader from 'UiKit/components/Base/VDialog/VDialogHeader.vue';
import VDialogTitle from 'UiKit/components/Base/VDialog/VDialogTitle.vue';
import VDialogClose from 'UiKit/components/Base/VDialog/VDialogClose.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useEarnWithdrawDialog } from './composables/useEarnWithdrawDialog';

const open = defineModel<boolean>('open');

const props = defineProps<{
  poolId?: string;
  profileId?: string | number;
  symbol?: string;
}>();

const { poolId, profileId, symbol } = toRefs(props);

const {
  model,
  isValid,
  isFieldRequired,
  getErrorText,
  isSubmitting,
  formattedSymbol,
  handleSubmit,
} = useEarnWithdrawDialog({
  poolId,
  profileId,
  symbol,
  onClose: () => {
    open.value = false;
  },
});
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="earn-withdraw"
    query-value="true"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="VEarnWithdrawDialog v-earn-withdraw-dialog"
    >
      <VDialogHeader>
        <VDialogTitle>
          Withdraw {{ formattedSymbol }}
        </VDialogTitle>
        <VDialogClose />
      </VDialogHeader>

      <div class="v-earn-withdraw-dialog__body">
        <VFormGroup
          v-slot="VFormGroupProps"
          label="Withdraw Amount"
          :required="isFieldRequired('amount')"
          :error-text="getErrorText('amount') as string[]"
          class="v-earn-withdraw-dialog__group"
        >
          <VFormInput
            :model-value="model.amount ? String(model.amount) : undefined"
            :is-error="VFormGroupProps.isFieldError"
            type="number"
            placeholder="0.00"
            size="large"
            @update:model-value="model.amount = $event ? Number($event) : null"
          />
        </VFormGroup>

        <div class="v-earn-withdraw-dialog__actions">
          <VButton
            variant="outlined"
            size="large"
            :disabled="isSubmitting"
            @click="open = false"
          >
            Cancel
          </VButton>
          <VButton
            size="large"
            :loading="isSubmitting"
            :disabled="isSubmitting || !isValid"
            @click="handleSubmit"
          >
            Withdraw
          </VButton>
        </div>
      </div>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-earn-withdraw-dialog {
  max-width: 480px;
  width: 100%;

  &__body {
    margin-top: 16px;
  }

  &__group {
    margin-bottom: 24px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>

