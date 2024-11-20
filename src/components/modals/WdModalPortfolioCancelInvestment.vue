<script setup lang="ts">
import {
  PropType, computed, nextTick, onMounted, reactive, ref, watch,
} from 'vue';
import VModalLayout from 'UiKit/components/VModal/VModalLayout.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { currency } from 'InvestCommon/helpers/currency';
import { IInvest } from 'InvestCommon/types/api/invest';
import { PostLinkTypes } from 'InvestCommon/types/api/blog';
import VFormTextarea from 'UiKit/components/VForm/VFormTextarea.vue';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'lodash';
import { VSvgIcon } from 'UiKit/components/VSvgIcon';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlContactUs, urlBlogSingle } from 'InvestCommon/global/links';


const props = defineProps({
  investment: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  userName: String,
});
const emit = defineEmits(['close']);

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    PatchIndividualProfile: {
      properties: {
        cancelation_reason: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType< FormModel>;

const model = reactive({} as FormModel);
const { submitFormToHubspot } = useHubspotForm('0b39c12f-9416-42f6-ab71-9f13e6423859');

const investmentsStore = useInvestmentsStore();
const {
  cancelInvestData, isCancelInvestLoading, setCancelOptionsData, setCancelErrorData,
} = storeToRefs(investmentsStore);
const usersStore = useUsersStore();
const { userAccountData } = storeToRefs(usersStore);

type FormModel = {
  cancelation_reason: string;
}
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
    void nextTick(() => scrollToError('WdModalPortfolioCancelInvestment'));
    return;
  }

  if (props.investment.id) {
    await investmentsStore.cancelInvestment(String(props.investment.id), model.cancelation_reason);
  }

  if (cancelInvestData.value) {
    void submitFormToHubspot({
      email: userAccountData.value?.email,
      cancellation_reason: model.cancelation_reason,
      cancellation_offer_name: props.investment.offer.name,
      cancellation_offer_id: props.investment.id,
    });
    void useOfferStore().getConfirmedOffers();
    emit('close');
  }
};

const onBackClick = () => {
  emit('close');
};

onMounted(() => {
  void useInvestmentsStore().setCanceOptions(String(props.investment.id));
});
// eslint-disable-next-line
watch(() => setCancelOptionsData.value, () => {
  validator = new PrecompiledValidator<FormModel>(setCancelOptionsData.value, schema.value);
});

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });
</script>

<template>
  <VModalLayout
    class="WdModalPortfolioCancelInvestment wd-modal-cancel-investment is--no-margin"
    @close="$emit('close')"
  >
    <template #default>
      <div
        id="download-content"
        ref="DownloadComp"
        class="wd-modal-cancel-investment__text"
      >
        <div class="wd-modal-cancel-investment__title is--h3__title">
          Cancel Investment
        </div>
        <p class="wd-modal-cancel-investment__text is--body">
          You are about to cancel your investment
          <strong>#{{ investment.id }}</strong> in <strong>{{ investment.offer.name }}</strong>.
          Your funds, {{ currency(Number(investment.amount), 0) }} will be send back to the funding
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
    </template>

    <template #footer>
      <div class="wd-modal-cancel-investment__footer-btns">
        <VButton
          variant="link"
          size="large"
          icon-placement="left"
          @click.stop="onBackClick"
        >
          <VSvgIcon
            name="arrow-left"
            alt="arrow left"
            class="wd-modal-cancel-investment__back-icon"
          />
          Back
        </VButton>
        <VButton
          color="danger"
          :loading="isCancelInvestLoading"
          :disabled="isBtnDisabled"
          @click.stop="cancelInvestHandler"
        >
          Cancel Investment
        </VButton>
      </div>
    </template>
  </VModalLayout>
</template>

<style lang="scss">
.wd-modal-cancel-investment {
  width: 700px !important;

  &__title {
    margin-top: 32px;
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
  }

  &__back-icon {
    width: 20px;
  }
}
</style>
