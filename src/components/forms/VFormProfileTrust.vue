<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import VFormPartialIdentification from './VFormPartialIdentification.vue';
import VFormPartialPersonalInformation from './VFormPartialPersonalInformation.vue';
import VFormPartialTrustInformation from './VFormPartialTrustInformation.vue';
import VFormPartialBusinessController from './VFormPartialBusinessController.vue';
import VFormPartialBeneficialOwnership from './VFormPartialBeneficialOwnership.vue';
import { FormChild } from 'InvestCommon/types/form';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { storeToRefs } from 'pinia';

defineProps({
  modelData: Object,
});

const userStore = useUsersStore();
const {
  selectedUserIndividualProfile, userAccountData,
} = storeToRefs(userStore);

const idFormRef = useTemplateRef<FormChild>('idFormChild');
const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
const trustInfoFormRef = useTemplateRef<FormChild>('trustInfoFormChild');
const businessControllerRef = useTemplateRef<FormChild>('businessControllerFormChild');
const beneficialOwnershipRef = useTemplateRef<FormChild>('beneficialOwnershipFormChild');

const model = computed(() => ({
  ...idFormRef.value?.model,
  ...personalFormRef.value?.model,
  ...trustInfoFormRef.value?.model,
  ...businessControllerRef.value?.model,
  ...beneficialOwnershipRef.value?.model,
}));

const isValid = computed(() => (
  idFormRef.value?.isValid && personalFormRef.value?.isValid
  && trustInfoFormRef.value?.isValid && businessControllerRef.value?.isValid
  && beneficialOwnershipRef.value?.isValid
));

const controllerData = computed(() => ({
  ...personalFormRef?.value?.model,
  email: userAccountData.value?.email,
}));

const onValidate = () => {
  idFormRef.value?.onValidate();
  personalFormRef.value?.onValidate();
  trustInfoFormRef.value?.onValidate();
  businessControllerRef.value?.onValidate();
  beneficialOwnershipRef.value?.onValidate();
};

defineExpose({
  model, isValid, onValidate,
});
</script>

<template>
  <div class="VFormProfileTrust v-form-profile-trust">
    <div class="v-form-profile-trust__subtitle is--h3__title is--margin-top">
      Trustee Information
    </div>
    <VFormPartialIdentification
      ref="idFormChild"
      :model-data="modelData"
    />
    <VFormPartialPersonalInformation
      ref="personalFormChild"
      :model-data="modelData || selectedUserIndividualProfile?.data"
      ein
    />
    <VFormPartialTrustInformation
      ref="trustInfoFormChild"
      :model-data="modelData"
    />
    <VFormPartialBusinessController
      ref="businessControllerFormChild"
      :model-data="modelData"
      :personal-data="controllerData"
      trust
    />
    <VFormPartialBeneficialOwnership
      ref="beneficialOwnershipFormChild"
      :model-data="modelData"
      trust
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-trust {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
