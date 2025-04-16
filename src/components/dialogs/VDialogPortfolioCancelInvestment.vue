<script setup lang="ts">
import {
  PropType, computed, nextTick, onMounted, reactive, ref, watch,
} from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { currency } from 'InvestCommon/helpers/currency';
import { IInvest } from 'InvestCommon/types/api/invest';
import { PostLinkTypes } from 'InvestCommon/types/api/blog';
import VFormTextarea from 'UiKit/components/Base/VForm/VFormTextarea.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'lodash';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlContactUs, urlBlogSingle } from 'InvestCommon/global/links';
import {
  VDialogContent, VDialogFooter, VDialog, VDialogTitle,
  VDialogHeader,
} from 'UiKit/components/Base/VDialog';

const props = defineProps({
  investment: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  userName: String,
});
const open = defineModel<boolean>();

type FormModel = {
  cancelation_reason: string;
}
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Individual: {
      properties: {
        cancelation_reason: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType< FormModel>;

const model = reactive({} as FormModel);
const { submitFormToHubspot } = useHubspotForm('0b39c12f-9416-42f6-ab71-9f13e6423859');

const investmentsStore = useInvestmentsStore();
const {
  cancelInvestData, isCancelInvestLoading, setCancelOptionsData, setCancelErrorData,
} = storeToRefs(investmentsStore);
const usersStore = useUsersStore();
const { userAccountData, selectedUserProfileId } = storeToRefs(usersStore);

let validator = new PrecompiledValidator<FormModel>(setCancelOptionsData.value, schema.value);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isBtnDisabled = computed(() => (
  !isValid.value
  || isCancelInvestLoading.value
));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const cancelInvestHandler = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('WdModalPortfolioCancelInvestment'));
    return;
  }

  if (props.investment?.id) {
    await investmentsStore.cancelInvestment(String(props.investment?.id), model.cancelation_reason);
  }

  if (cancelInvestData.value) {
    submitFormToHubspot({
      email: userAccountData.value?.email,
      cancellation_reason: model.cancelation_reason,
      cancellation_offer_name: props.investment?.offer?.name,
      cancellation_offer_id: props.investment?.id,
    });
    useOfferStore().getConfirmedOffers(selectedUserProfileId.value);
    open.value = false;
  }
};

const onBackClick = () => {
  open.value = false;
};

onMounted(() => {
  useInvestmentsStore().setCanceOptions(String(props.investment?.id));
});

watch(() => setCancelOptionsData.value, () => {
  validator = new PrecompiledValidator<FormModel>(setCancelOptionsData.value, schema.value);
});

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });
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
            Your funds, {{ currency(Number(investment?.amount), 0) }} will be send back to the funding
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
            :model="model"
            :validation="validation"
            :schema-front="schema"
            :error-text="setCancelErrorData?.note"
            path="cancelation_reason"
            label="Please let us know your cancellation reason"
          >
            <VFormTextarea
              :model-value="model.cancelation_reason"
              rows="3"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Cancellation Reason"
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
            :loading="isCancelInvestLoading"
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
