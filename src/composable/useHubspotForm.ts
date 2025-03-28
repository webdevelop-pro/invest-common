import { ref } from 'vue';
import { fetchHubspotForm } from 'InvestCommon/services';

export const useHubspotForm = (formId: string) => {
  const hubspotFormId = ref(formId);

  const setHSFieldsData = (model: object) => {
    const result: object[] = [];
    Object.entries(model).forEach(([name, value]) => {
      result.push({ name, value: value || '' });
    });
    return result;
  };

  const getRequestData = (model: object) => ({
    context: {
      pageUri: window.location.href,
      pageName: document.title,
    },
    fields: setHSFieldsData(model),
  });

  const submitFormToHubspot = async (model: object) => {
    await fetchHubspotForm(hubspotFormId.value, getRequestData(model)).catch((error) => {
      console.log(error);
    });
  };

  return {
    submitFormToHubspot,
  };
};
