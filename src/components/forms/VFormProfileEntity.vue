<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import VFormPartialIdentification from './VFormPartialIdentification.vue';
import VFormPartialPersonalInformation from './VFormPartialPersonalInformation.vue';
import VFormPartialEntityInformation from './VFormPartialEntityInformation.vue';
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
const entityInfoFormRef = useTemplateRef<FormChild>('entityInfoFormChild');
const businessControllerRef = useTemplateRef<FormChild>('businessControllerFormChild');
const beneficialOwnershipRef = useTemplateRef<FormChild>('beneficialOwnershipFormChild');

const model = computed(() => ({
  ...idFormRef.value?.model,
  ...personalFormRef.value?.model,
  ...entityInfoFormRef.value?.model,
  ...businessControllerRef.value?.model,
  ...beneficialOwnershipRef.value?.model,
}));

const isValid = computed(() => (
  idFormRef.value?.isValid && personalFormRef.value?.isValid
  && entityInfoFormRef.value?.isValid && businessControllerRef.value?.isValid
  && beneficialOwnershipRef.value?.isValid
));

const controllerData = computed(() => ({
  ...personalFormRef?.value?.model,
  email: userAccountData.value?.email,
}));

const onValidate = () => {
  idFormRef.value?.onValidate();
  personalFormRef.value?.onValidate();
  entityInfoFormRef.value?.onValidate();
  businessControllerRef.value?.onValidate();
  beneficialOwnershipRef.value?.onValidate();
};

defineExpose({
  model, isValid, onValidate,
});
</script>

<template>
  <div class="VFormProfileEntity v-form-profile-entity">
    <div class="v-form-profile-entity__subtitle is--h3__title ">
      Personal Information
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
    <VFormPartialEntityInformation
      ref="entityInfoFormChild"
      :model-data="modelData"
    />
    <VFormPartialBusinessController
      ref="businessControllerFormChild"
      :model-data="modelData"
      :personal-data="controllerData"
    />
    <VFormPartialBeneficialOwnership
      ref="beneficialOwnershipFormChild"
      :model-data="modelData"
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-entity {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
