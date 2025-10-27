import {
  ref, computed,
  watch, nextTick,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { descriptionFileRule, errorMessageRule, noteFileRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { FormModelAccreditationFileInput } from 'InvestCommon/types/form';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

export const useAccreditationUpload = defineStore('useAccreditationUpload', () => {
  const router = useRouter();
  const accreditationRepository = useRepositoryAccreditation();
  const { updateState, createState } = storeToRefs(accreditationRepository);
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId, selectedUserProfileType } = storeToRefs(userProfileStore);

  const backButtonText = ref('Back to Dashboard');
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } },
    },
    {
      text: 'Accreditation Verification',
    },
  ]);

  const isDisabledButton = ref(false);
  const isLoading = ref(false);
  const accreditationFiles = ref<File[]>([]);
  const accreditationNote = ref('');
  const accreditationDescriptions = ref<string[]>([]);
  const isFieldsValid = ref(true);
  const validateTrigger = ref(false);
  const filesUploadError = ref('');
  const allFiles = ref<File[]>([]);

  const requiredValueSchema = computed(() => {
    const V = ['description1', 'note'] as string[];
    if (allFiles.value.length >= 2) {
      V.push('description2');
    }
    if (allFiles.value.length >= 3) {
      V.push('description3');
    }
    if (allFiles.value.length >= 4) {
      V.push('description4');
    }
    if (allFiles.value.length >= 5) {
      V.push('description5');
    }
    if (allFiles.value.length >= 6) {
      V.push('description6');
    }
    return V;
  });

  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Individual: {
        properties: {
          description1: descriptionFileRule,
          description2: descriptionFileRule,
          description3: descriptionFileRule,
          description4: descriptionFileRule,
          description5: descriptionFileRule,
          description6: descriptionFileRule,
          note: noteFileRule,
        },
        type: 'object',
        required: requiredValueSchema.value,
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Individual',
  } as unknown as JSONSchemaType<FormModelAccreditationFileInput>));
  
  // Define field paths for validation
  const fieldsPaths = ['description1', 'description2', 'description3', 'description4', 'description5', 'description6', 'note'];

  const {
    model, validation, isValid, onValidate,
    formErrors, isFieldRequired, getErrorText,
    scrollToError, getOptions, getReferenceType,
  } = useFormValidation<FormModelAccreditationFileInput>(
    schemaFrontend,
    undefined,
    {} as FormModelAccreditationFileInput,
    fieldsPaths,
  );

  const isAccreditationCanUpload = computed(() => {
    if (!selectedUserProfileData.value) {
      return false;
    }
    return (
      selectedUserProfileData.value.isAccreditationPending
      && selectedUserProfileData.value.isAccreditationApproved
    );
  });

  const uploadAccreditationDocumentErrorData = computed(() => createState?.value?.error || updateState?.value?.error);

  const sendFiles = async () => {
    const promises = [] as unknown[];
    accreditationFiles.value.forEach((file, idx) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_title', accreditationDescriptions.value[idx]);

      if (selectedUserProfileData.value?.user_id && selectedUserProfileData.value?.id) {
        promises.push(accreditationRepository.uploadDocument(
          selectedUserProfileData.value?.user_id,
          selectedUserProfileData.value?.id,
          formData,
        ));
      }
    });

    isLoading.value = true;
    try {
      await Promise.all(promises);

      if (selectedUserProfileData.value?.id && accreditationNote.value) {
        if (selectedUserProfileData.value.isAccreditationNew) {
          await accreditationRepository.create(
            selectedUserProfileData.value?.id,
            accreditationNote.value,
          );
        } else {
          await accreditationRepository.update(
            selectedUserProfileData.value?.id,
            accreditationNote.value,
          );
        }
      }

      if (!createState?.value?.error && !updateState?.value?.error) {
        useRepositoryProfiles().getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
        router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
      }
    } catch (err) {
      console.error('Error uploading files:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const handleSave = () => {
    validateTrigger.value = true;
    nextTick(() => {
      if (!isFieldsValid.value) {
        return;
      }
      sendFiles();
    });
  };

  const onFilesChange = (filesInner: File[]) => {
    allFiles.value = filesInner;
    accreditationFiles.value = filesInner;
    validateTrigger.value = false;
    if (!isValid.value) {
      onValidate();
    }
  };

  const onFileRemove = (index: number) => {
    if (model[`description${index + 1}`]) {
      delete model[`description${index + 1}`];
    }
    accreditationDescriptions.value = Object.values(model)
      .filter((value): value is string => typeof value === 'string');
  };

  const onModelChange = (modelInner: FormModelAccreditationFileInput) => {
    const { note, ...fields } = modelInner;
    accreditationNote.value = note;
    validateTrigger.value = false;
    accreditationDescriptions.value = Object.values(fields);
  };

  const onValidChange = (validInner: boolean) => {
    isFieldsValid.value = validInner;
    validateTrigger.value = false;
  };

  // const getErrorText = (index: number) => {
  //   const error = createState?.value?.error || updateState?.value?.error;
  //   if (!error || !error[`description${index}`]) {
  //     return undefined;
  //   }
  //   return error[`description${index}`];
  // };

  watch([isAccreditationCanUpload], ([newValue]) => {
    if (!newValue) {
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
    }
  });

  watch(() => [isValid.value, filesUploadError.value], (value) => {
    const isInvalid = !value[0] || !!value[1];
    isFieldsValid.value = !isInvalid;
  });

  watch(() => model, () => {
    if (!isValid.value) {
      onValidate();
    }
    onModelChange(model);
  }, { deep: true });

  watch(() => validateTrigger.value, () => {
    if (validateTrigger.value) {
      onValidate();
    }
  }, { immediate: true });

  return {
    backButtonText,
    breadcrumbs,
    isDisabledButton,
    isLoading,
    validateTrigger,
    isFieldsValid,
    handleSave,
    onFilesChange,
    onModelChange,
    onValidChange,
    model,
    allFiles,
    validation,
    schemaFrontend,
    getErrorText,
    onFileRemove,
    uploadAccreditationDocumentErrorData,
    sendFiles,
    accreditationFiles,
    accreditationNote,
    accreditationDescriptions,
    filesUploadError,
    isAccreditationCanUpload,
    // Modern validation helpers
    formErrors,
    isFieldRequired,
    scrollToError,
    getOptions,
    getReferenceType,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccreditationUpload, import.meta.hot));
}
