<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import VFormPartialIdentification from './VFormPartialIdentification.vue';
import VFormPartialPersonalInformation from './VFormPartialPersonalInformation.vue';
import VFormPartialCustodian from './VFormPartialCustodian.vue';
import { FormChild } from 'InvestCommon/types/form';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { storeToRefs } from 'pinia';

defineProps({
  modelData: Object,
});

const userStore = useUsersStore();
const {
  selectedUserIndividualProfile,
} = storeToRefs(userStore);

const idFormRef = useTemplateRef<FormChild>('idFormChild');
const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
const custodianFormRef = useTemplateRef<FormChild>('custodianFormChild');

const model = computed(() => ({
  ...idFormRef.value?.model,
  ...personalFormRef.value?.model,
  ...custodianFormRef.value?.model,
}));

const isValid = computed(() => (
  idFormRef.value?.isValid && personalFormRef.value?.isValid
  && custodianFormRef.value?.isValid
));

const onValidate = () => {
  idFormRef.value?.onValidate();
  personalFormRef.value?.onValidate();
  custodianFormRef.value?.onValidate();
};

defineExpose({
  model, isValid, onValidate,
});
</script>

<template>
  <div class="VFormProfileSDIRA v-form-profile-sdira">
    <div class="v-form-profile-sdira__subtitle is--h3__title is--margin-top">
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
    <VFormPartialCustodian
      ref="custodianFormChild"
      :model-data="modelData"
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-sdira {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
