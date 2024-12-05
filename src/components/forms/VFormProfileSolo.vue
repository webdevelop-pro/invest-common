<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import VFormPartialIdentification from './VFormPartialIdentification.vue';
import VFormPartialPersonalInformation from './VFormPartialPersonalInformation.vue';
import VFormPartialPlanInformation from './VFormPartialPlanInformation.vue';
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
const planFormRef = useTemplateRef<FormChild>('planFormChild');

const model = computed(() => ({
  ...idFormRef.value?.model,
  ...personalFormRef.value?.model,
  ...planFormRef.value?.model,
}));

const isValid = computed(() => (
  idFormRef.value?.isValid && personalFormRef.value?.isValid
  && planFormRef.value?.isValid
));

const onValidate = () => {
  idFormRef.value?.onValidate();
  personalFormRef.value?.onValidate();
  planFormRef.value?.onValidate();
};

defineExpose({
  model, isValid, onValidate,
});
</script>

<template>
  <div class="VFormProfileSolo v-form-profile-solo">
    <div class="v-form-profile-solo__subtitle is--h3__title ">
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
    <VFormPartialPlanInformation
      ref="planFormChild"
      :model-data="modelData"
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-solo {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
