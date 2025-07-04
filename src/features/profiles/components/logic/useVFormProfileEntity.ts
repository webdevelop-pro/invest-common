import { computed, useTemplateRef } from 'vue';
import { FormChild } from 'InvestCommon/types/form';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

export function useVFormProfileEntity() {
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
  const entityInfoFormRef = useTemplateRef<FormChild>('entityInfoFormChild');
  const businessControllerRef = useTemplateRef<FormChild>('businessControllerFormChild');
  const beneficialOwnershipRef = useTemplateRef<FormChild>('beneficialOwnershipFormChild');

  const model = computed(() => ({
    ...personalFormRef.value?.model,
    ...entityInfoFormRef.value?.model,
    ...businessControllerRef.value?.model,
    ...beneficialOwnershipRef.value?.model,
  }));

  const isValid = computed(() => (
    personalFormRef.value?.isValid
    && entityInfoFormRef.value?.isValid && businessControllerRef.value?.isValid
    && beneficialOwnershipRef.value?.isValid
  ));

  const controllerData = computed(() => ({
    ...personalFormRef?.value?.model,
    email: userSessionTraits.value?.email,
  }));

  const onValidate = () => {
    personalFormRef.value?.onValidate();
    entityInfoFormRef.value?.onValidate();
    businessControllerRef.value?.onValidate();
    beneficialOwnershipRef.value?.onValidate();
  };

  return {
    personalFormRef,
    entityInfoFormRef,
    businessControllerRef,
    beneficialOwnershipRef,
    model,
    isValid,
    controllerData,
    onValidate,
  };
}
