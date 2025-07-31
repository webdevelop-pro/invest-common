import {
  ref, computed, nextTick,
  toRaw, watch,
  reactive,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import env from 'InvestCommon/global';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError, getFilteredObject } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';
import {
  address1Rule, address2Rule, cityRule, emailRule, errorMessageRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { checkObjectAndDeleteNotRequiredFields } from 'InvestCommon/helpers/general';

export const useFormBackgroundInformation = () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const backButtonText = ref('Back to Profile Details');
  const accountRoute = computed(() => (
    { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } }));
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: accountRoute.value,
    },
    {
      text: 'Profile Details',
      to: accountRoute.value,
    },
    {
      text: 'Your Background Information',
    },
  ]);

  const isLoading = ref(false);
  const isLoadingFields = computed(() => getProfileByIdOptionsState.value.loading);
  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_BACKGROUND_INFORMATION);

  const dataEmploymentData = computed(() => selectedUserProfileData.value?.data?.employment);
  const dataFinraData = computed(() => selectedUserProfileData.value?.data?.finra_affiliated);
  const dataShareholderData = computed(() => selectedUserProfileData.value?.data?.ten_percent_shareholder);

  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => (
    getProfileByIdOptionsState.value.data ? structuredClone(toRaw(getProfileByIdOptionsState.value.data)) : {}));

  interface FormModelBackgroundInformation {
    employment: {
      type: string;
      employer_name: string;
      title: string;
      address1: string;
      address2: string;
      city: string;
      zip_code: string;
    };
    finra_affiliated: {
      member_association: boolean;
      correspondence: boolean;
      member_firm_name: string;
      compliance_contact_name: string;
      compliance_contant_email: string;
    };
    ten_percent_shareholder: {
      shareholder_association: boolean;
      ticker_symbol_list: string;
    };
    irs_backup_withholding: boolean;
  }

  let modelLocal = reactive({
    employment: {
      type: selectedUserProfileData.value?.data?.employment?.type || 'Retired',
    },
    finra_affiliated: {
      member_firm_name: selectedUserProfileData.value?.data?.finra_affiliated?.member_firm_name || '',
      compliance_contact_name: selectedUserProfileData.value?.data.finra_affiliated?.compliance_contact_name || '',
      compliance_contant_email: selectedUserProfileData.value?.data.finra_affiliated?.compliance_contant_email || '',
      correspondence: selectedUserProfileData.value?.data.finra_affiliated?.correspondence || false,
      member_association: selectedUserProfileData.value?.data.finra_affiliated?.member_association || false,
    },
    ten_percent_shareholder: {
      shareholder_association: dataShareholderData.value?.shareholder_association || false,
      ticker_symbol_list: dataShareholderData.value?.ticker_symbol_list || '',
    },
    irs_backup_withholding: selectedUserProfileData.value?.data?.irs_backup_withholding || false,
  } as FormModelBackgroundInformation);

  const isAdditionalFields = computed(() => (
    modelLocal.employment?.type.includes('full-time')
  || modelLocal.employment?.type.includes('part-time')
  || modelLocal.employment?.type.includes('self')
  ));

  const requiredEmployment = computed(() => {
    const requiredRules = ['type'];
    if (isAdditionalFields.value) {
      requiredRules.push('address1');
      requiredRules.push('city');
      requiredRules.push('zip_code');
    }
    if (modelLocal.employment?.type.includes('full-time')
  || modelLocal.employment?.type.includes('part-time')) {
      requiredRules.push('employer_name');
      requiredRules.push('title');
    }
    return requiredRules;
  });

  const EmploymentInformation = computed(() => ({
    properties: {
      type: {},
      employer_name: {},
      title: {},
      address1: address1Rule,
      address2: address2Rule,
      city: cityRule,
      zip_code: zipRule,
    },
    type: 'object',
    additionalProperties: false,
    required: requiredEmployment.value,
  }));

  const requiredFinra = computed(() => {
    const requiredRules = [];
    if (modelLocal.finra_affiliated?.member_association) {
      requiredRules.push('member_firm_name');
      requiredRules.push('compliance_contact_name');
      requiredRules.push('compliance_contant_email');
    }
    return requiredRules;
  });

  const FinraInformation = computed(() => ({
    properties: {
      member_association: {},
      correspondence: {},
      member_firm_name: {},
      compliance_contact_name: {},
      compliance_contant_email: emailRule,
    },
    type: 'object',
    additionalProperties: false,
    required: requiredFinra.value,
  }));
  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      EmploymentTypes: EmploymentInformation.value,
      FINRAAffiliated: FinraInformation.value,
      Individual: {
        properties: {
          employment: { type: 'object', $ref: '#/definitions/EmploymentTypes' },
          finra_affiliated: { type: 'object', $ref: '#/definitions/FINRAAffiliated' },
          ten_percent_shareholder: {},
          irs_backup_withholding: {
            title: 'irs_backup_withholding',
            type: 'boolean',
          },
        },
        type: 'object',
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Individual',
  } as unknown as JSONSchemaType<FormModelBackgroundInformation>
  ));
  const {
    model, validation, isValid, onValidate,
  } = useFormValidation<FormModelBackgroundInformation>(
    schemaFrontend,
    schemaBackend,
    modelLocal,
  );
  const isDisabledButton = computed(() => (!isValid.value));
  const formModel = {
    employment: {},
    finra_affiliated: {},
    ten_percent_shareholder: {},
    irs_backup_withholding: {},
  };
  const schemaObject = computed(() => getFilteredObject(schemaBackend.value, formModel) || {});
  const optionsEmployment = computed(() => getOptions('employment.type', schemaObject));

  const handleSave = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('ViewDashboardBackgroundInformation'));
      return;
    }

    isLoading.value = true;
    try {
      await useRepositoryProfilesStore.setProfileById(
        {
          employment: {
            ...model.employment,
            type: model.employment?.type,
          },
          finra_affiliated: model.finra_affiliated,
          ten_percent_shareholder: model.ten_percent_shareholder,
          irs_backup_withholding: model.irs_backup_withholding,
        },
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );

      submitFormToHubspot({
        email: userSessionTraits.value?.email,
        employment_type: model.employment?.type,
        employer_name: model.employment?.employer_name,
        title: model.employment?.title,
        employer_address_1: model.employment?.address1,
        employer_address_2: model.employment?.address2,
        city: model.employment?.city,
        zip: model.employment?.zip_code,
        ...model.finra_affiliated,
        ...model.ten_percent_shareholder,
        irs_backup_withholding: model.irs_backup_withholding,
        compliance_contractemail: model.finra_affiliated?.compliance_contant_email,
      });
      useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      isLoading.value = false;
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
    } finally {
      isLoading.value = false;
    }
  };

  watch(() => selectedUserProfileData.value?.data.employment, () => {
    if (dataEmploymentData.value?.type && model.employment) {
      model.employment.type = dataEmploymentData.value?.type;
    }
    if (dataEmploymentData.value?.employer_name && model.employment) {
      model.employment.employer_name = dataEmploymentData.value?.employer_name;
    }
    if (dataEmploymentData.value?.title && model.employment){
      model.employment.title = dataEmploymentData.value?.title;
    }
    if (dataEmploymentData.value?.address1 && model.employment) {
      model.employment.address1 = dataEmploymentData.value?.address1;
    }
    if (dataEmploymentData.value?.address2 && model.employment) {
      model.employment.address2 = dataEmploymentData.value?.address2;
    }
    if (dataEmploymentData.value?.city && model.employment) {
      model.employment.city = dataEmploymentData.value?.city;
    }
    if (dataEmploymentData.value?.zip_code && model.employment) {
      model.employment.zip_code = dataEmploymentData.value?.zip_code;
    }
  }, { deep: true, immediate: true });

  watch(() => selectedUserProfileData.value?.data.finra_affiliated, () => {
    if (dataFinraData.value?.member_association && model.finra_affiliated) {
      model.finra_affiliated.member_association = dataFinraData.value?.member_association;
    }
    if (dataFinraData.value?.correspondence && model.finra_affiliated) {
      model.finra_affiliated.correspondence = dataFinraData.value?.correspondence;
    }
    if (dataFinraData.value?.member_firm_name && model.finra_affiliated) {
      model.finra_affiliated.member_firm_name = dataFinraData.value?.member_firm_name;
    }
    if (dataFinraData.value?.compliance_contact_name && model.finra_affiliated) {
      model.finra_affiliated.compliance_contact_name = dataFinraData.value?.compliance_contact_name;
    }
    if (dataFinraData.value?.compliance_contant_email && model.finra_affiliated) {
      model.finra_affiliated.compliance_contant_email = dataFinraData.value?.compliance_contant_email;
    }
  }, { deep: true, immediate: true });

  watch(() => selectedUserProfileData.value?.data.ten_percent_shareholder, () => {
    if (dataShareholderData.value?.shareholder_association && model.ten_percent_shareholder) {
      model.ten_percent_shareholder.shareholder_association = dataShareholderData.value?.shareholder_association;
    }
    if (dataShareholderData.value?.ticker_symbol_list && model.ten_percent_shareholder) {
      model.ten_percent_shareholder.ticker_symbol_list = dataShareholderData.value?.ticker_symbol_list;
    }
  }, { deep: true, immediate: true });

  watch(() => selectedUserProfileData.value?.data.irs_backup_withholding, () => {
    if (selectedUserProfileData.value?.data.irs_backup_withholding !== undefined) {
      model.irs_backup_withholding = selectedUserProfileData.value?.data.irs_backup_withholding;
    }
  }, { deep: true, immediate: true });

  watch(() => model.employment?.type, () => {
    if (model.employment) {
      model.employment = checkObjectAndDeleteNotRequiredFields(['type'], requiredEmployment.value, model.employment);
    }
  });
  watch(() => model.finra_affiliated?.member_association, () => {
    if (model.finra_affiliated) {
      model.finra_affiliated = checkObjectAndDeleteNotRequiredFields(['member_association', 'correspondence'], requiredFinra.value, model.finra_affiliated);
    }
  });

  watch(() => model, () => {
    modelLocal = model;
  }, { deep: true, immediate: true });

  return {
    backButtonText,
    breadcrumbs,
    isDisabledButton,
    isLoading,
    isLoadingFields,
    handleSave,
    schemaBackend,
    errorData,
    optionsEmployment,
    model,
    schemaFrontend,
    validation,
    isAdditionalFields,
  };
};
