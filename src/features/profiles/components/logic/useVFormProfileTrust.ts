import { computed, useTemplateRef } from 'vue';
import { FormChild } from 'InvestCommon/types/form';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

export function useVFormProfileTrust(modelData: any) {
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
  const trustInfoFormRef = useTemplateRef<FormChild>('trustInfoFormChild');
  const businessControllerRef = useTemplateRef<FormChild>('businessControllerFormChild');
  const beneficialOwnershipRef = useTemplateRef<FormChild>('beneficialOwnershipFormChild');

  const model = computed(() => ({
    ...personalFormRef.value?.model,
    ...trustInfoFormRef.value?.model,
    ...businessControllerRef.value?.model,
    ...beneficialOwnershipRef.value?.model,
  }));

  const isValid = computed(() => (
    personalFormRef.value?.isValid
    && trustInfoFormRef.value?.isValid && businessControllerRef.value?.isValid
    && beneficialOwnershipRef.value?.isValid
  ));

  const controllerData = computed(() => ({
    ...personalFormRef?.value?.model,
    email: userSessionTraits.value?.email,
  }));

  const onValidate = () => {
    personalFormRef.value?.onValidate();
    trustInfoFormRef.value?.onValidate();
    businessControllerRef.value?.onValidate();
    beneficialOwnershipRef.value?.onValidate();
  };

  return {
    personalFormRef,
    trustInfoFormRef,
    businessControllerRef,
    beneficialOwnershipRef,
    model,
    isValid,
    controllerData,
    onValidate,
  };
}
