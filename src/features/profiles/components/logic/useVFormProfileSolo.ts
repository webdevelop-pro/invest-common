import { computed } from 'vue';
import { useTemplateRef } from 'vue';
import { FormChild } from 'InvestCommon/types/form';

export function useVFormProfileSolo(modelData: any) {
  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
  const planFormRef = useTemplateRef<FormChild>('planFormChild');

  const model = computed(() => ({
    ...personalFormRef.value?.model,
    ...planFormRef.value?.model,
  }));

  const isValid = computed(() => (
    personalFormRef.value?.isValid && planFormRef.value?.isValid
  ));

  const onValidate = () => {
    personalFormRef.value?.onValidate();
    planFormRef.value?.onValidate();
  };

  return {
    personalFormRef,
    planFormRef,
    model,
    isValid,
    onValidate,
  };
} 