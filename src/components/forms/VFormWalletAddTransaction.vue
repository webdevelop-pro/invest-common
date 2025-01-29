<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  reactive, computed, PropType, ref, watch, nextTick,
} from 'vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useProfileWalletTransactionStore } from 'InvestCommon/store/useProfileWallet/useProfileWalletTransaction';
import { useProfileWalletStore } from 'InvestCommon/store/useProfileWallet/useProfileWallet';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import { ROUTE_DASHBOARD_WALLET } from 'InvestCommon/helpers/enums/routes';
import { storeToRefs } from 'pinia';
import { WalletAddTransactionTypes } from 'InvestCommon/types/api/wallet';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'lodash';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { FormModelAddTransaction } from 'InvestCommon/types/form';

const emit = defineEmits(['cancel']);

const props = defineProps({
  transactionType: {
    type: String as PropType<WalletAddTransactionTypes>,
    required: true,
  },
});

const usersStore = useUsersStore();
const { selectedUserProfileId } = storeToRefs(usersStore);
const profileWalletStore = useProfileWalletStore();
const { currentBalance, pendingOutcomingBalance } = storeToRefs(profileWalletStore);

const isTypeDeposit = ref((props.transactionType === WalletAddTransactionTypes.deposit));
const titile = ref((isTypeDeposit.value ? 'Add Funds' : 'Withdraw'));
const maxWithdraw = computed(() => (currentBalance.value - pendingOutcomingBalance.value));
const schemaMaximum = computed(() => (isTypeDeposit.value ? 1000000 : maxWithdraw.value));
const schemaMaximumError = computed(() => (isTypeDeposit.value ? 'Maximum available is $1,000,000' : `Maximum available is $${maxWithdraw.value}`));
const text = computed(() => (isTypeDeposit.value ? 'transaction is $1,000,000' : `available ${maxWithdraw.value}`));

const router = useRouter();
const globalLoader = useGlobalLoader();
globalLoader.hide();

const profileWalletTransactionStore = useProfileWalletTransactionStore();
const {
  isSetProfileWalletAddTransactionLoading, setProfileWalletAddTransactionErrorData,
  isSetProfileWalletAddTransactionError,
} = storeToRefs(profileWalletTransactionStore);

const schemaAddTransaction = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Individual: {
      properties: {
        amount: {
          type: 'number',
          minimum: 1,
          maximum: schemaMaximum.value,
          errorMessage: {
            maximum: schemaMaximumError.value,
            minimum: 'Amount should be at least $1',
          },
        },
      },
      type: 'object',
      required: ['amount'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelAddTransaction>));

const model = reactive({
} as FormModelAddTransaction);

let validator = new PrecompiledValidator<FormModelAddTransaction>(
  schemaAddTransaction.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetProfileWalletAddTransactionLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const saveHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormWalletAddTransaction'));
    return;
  }

  await profileWalletTransactionStore.setProfileWalletAddTransaction(props.transactionType, Number(model.amount));
  if (isSetProfileWalletAddTransactionError.value) return;
  void router.push({ name: ROUTE_DASHBOARD_WALLET, params: { profileId: selectedUserProfileId.value } });
  emit('cancel');
};

const cancelHandler = () => {
  emit('cancel');
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

// eslint-disable-next-line
watch(() => [schemaAddTransaction.value], () => {
  validator = new PrecompiledValidator<FormModelAddTransaction>(
    schemaAddTransaction.value,
  );
});
</script>

<template>
  <div class="VFormWalletAddTransaction form-wallet-add-transaction">
    <div class="form-wallet-add-transaction__content">
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-front="schemaAddTransaction"
            :error-text="setProfileWalletAddTransactionErrorData?.amount"
            path="amount"
            class="form-wallet-add-transaction__input"
          >
            <VFormInput
              :is-error="VFormGroupProps.isFieldError"
              :model-value="model.amount ? String(model.amount) : null"
              name="amount"
              money-format
              @update:model-value="model.amount = numberFormatter($event)"
            />
          </VFormGroup>
          <div class="form-wallet-add-transaction__text is--small">
            Maximum {{ text }}
          </div>
        </FormCol>
      </FormRow>
    </div>
    <div class="form-wallet-add-transaction__footer">
      <VButton
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </VButton>
      <VButton
        :disabled="isDisabledButton"
        :loading="isSetProfileWalletAddTransactionLoading"
        data-testid="button"
        @click="saveHandler"
      >
        {{ titile }}
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
.form-wallet-add-transaction {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin: 0 auto;
  width: 700px;

  &__header {
    margin-top: 33px;
    margin-bottom: 20px;
  }

  &__text {
    color: $gray-70;
    margin-top: 4px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
    margin-bottom: 4px;
  }
}
</style>
