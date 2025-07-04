import { computed, useTemplateRef } from 'vue';
import { FormChild } from 'InvestCommon/types/form';

export function useVFormProfileSDIRA() {
  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
  const custodianFormRef = useTemplateRef<FormChild>('custodianFormChild');

  const model = computed(() => ({
    ...personalFormRef.value?.model,
    ...custodianFormRef.value?.model,
  }));

  const isValid = computed(() => (
    personalFormRef.value?.isValid && custodianFormRef.value?.isValid
  ));

  const onValidate = () => {
    personalFormRef.value?.onValidate();
    custodianFormRef.value?.onValidate();
  };

  return {
    personalFormRef,
    custodianFormRef,
    model,
    isValid,
    onValidate,
  };
}
