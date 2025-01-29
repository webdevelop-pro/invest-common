<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, nextTick,
} from 'vue';
import { useAccreditationStore } from 'InvestCommon/store/useAccreditation';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import AccreditationFileInput from './components/AccreditationFileInput.vue';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useRouter } from 'vue-router';
import { FormModelAccreditationFileInput } from './utils';
import { scrollToError } from 'UiKit/helpers/validation/general';

const router = useRouter();
const userProfilesStore = useUserProfilesStore();
const accreditationStore = useAccreditationStore();
const { createAccreditationData, updateAccreditationData } = storeToRefs(accreditationStore);
const {
  isSetProfileByIdLoading,
} = storeToRefs(userProfilesStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId, selectedUserProfileType } = storeToRefs(usersStore);

// const { submitFormToHubspot } = useHubspotForm('4dfe165f-70df-446a-ae60-0185da755bdb');

const isLoading = ref(false);
const accreditationFiles = ref<File[]>([]);
const accreditationNote = ref('');
const accreditationDescriptions = ref<string[]>([]);
const isFieldsValid = ref(true);
const validateTrigger = ref(false);
const isCreateAccreditation = computed(() => selectedUserProfileData.value?.accreditation_status === 'new');
const isDisabledButton = computed(() => (!isFieldsValid.value || isSetProfileByIdLoading.value));

const sendFiles = async () => {
  const promises = [] as unknown[];
  accreditationFiles.value.forEach((file, idx) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_title', accreditationDescriptions.value[idx]);

    if (selectedUserProfileData.value?.user_id && selectedUserProfileData.value?.id) {
      promises.push(accreditationStore.uploadAccreditationDocument(
        selectedUserProfileData.value?.user_id,
        selectedUserProfileData.value?.id,
        formData,
      ));
    }
  });

  isLoading.value = true;
  await Promise.all(promises);
  if (selectedUserProfileData.value?.id && accreditationNote.value) {
    if (isCreateAccreditation.value) {
      await accreditationStore.createAccreditation(
        selectedUserProfileData.value?.id,
        accreditationNote.value,
      );
    } else {
      await accreditationStore.updateAccreditation(
        selectedUserProfileData.value?.id,
        accreditationNote.value,
      );
    }
  }

  isLoading.value = false;

  if ((createAccreditationData.value && isCreateAccreditation.value)
    || (updateAccreditationData.value && !isCreateAccreditation.value)) {
    void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
    void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
  }
};

const saveHandler = () => {
  validateTrigger.value = true;
  void nextTick(() => {
    if (!isFieldsValid.value) {
      void nextTick(() => scrollToError('FormAccreditationUploadFiles'));
      return;
    }
    void sendFiles();
  });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const onFilesChange = (filesInner: File[]) => {
  accreditationFiles.value = filesInner;
  validateTrigger.value = false;
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
</script>

<template>
  <div class="FormAccreditationUploadFiles form-accreditation-upload-files">
    <h1 class="form-accreditation-upload-files__header is--h1__title">
      Accreditation Verification
    </h1>
    <p class="form-accreditation-upload-files__subheader is--subheading-2">
      Only investors who meet the financial or professional requirements are permitted to invest.
    </p>
    <div class="form-accreditation-upload-files__info">
      <div class="form-accreditation-upload-files__info-item">
        <div class="form-accreditation-upload-files__info-title is--h5__title">
          Financial Qualifications
        </div>
        <ul class="form-accreditation-upload-files__info-list is--small">
          <li class="form-accreditation-upload-files__info-list-item">
            Your net worth (or your joint net worth with your spouse) is over <strong>$1 million</strong>, including
            all liquid assets except your primary residence.
          </li>
          <li class="form-accreditation-upload-files__info-list-item">
            Your individual income was over <strong>$200,000</strong> (or your joint income was over
            <strong>$300,000</strong>)each of the past two years, and you have the reasonable expectation
            of the same income in the current year3.
          </li>
        </ul>
      </div>
      <div class="form-accreditation-upload-files__info-item">
        <div class="form-accreditation-upload-files__info-title is--h5__title">
          Professional Qualifications
        </div>
        <ul class="form-accreditation-upload-files__info-list is--small">
          <li class="form-accreditation-upload-files__info-list-item">
            Investment professionals in good standing with a Series 7, Series 65, or Series 82 license.
          </li>
          <li class="form-accreditation-upload-files__info-list-item">
            Directors, general partners, or executive officers of the company selling the securities.
          </li>
          <li class="form-accreditation-upload-files__info-list-item">
            For securities in a private fund, knowledgeable employees of the fund qualify for
            accredited investor status3.
          </li>
        </ul>
      </div>
    </div>
    <div class="form-accreditation-upload-files__content">
      <AccreditationFileInput
        :validate="validateTrigger"
        @files="onFilesChange"
        @model="onModelChange"
        @valid="onValidChange"
      />
    </div>
    <div class="form-accreditation-upload-files__footer">
      <VButton
        size="large"
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </VButton>
      <VButton
        size="large"
        :disabled="isDisabledButton"
        :loading="isLoading"
        data-testid="button"
        @click="saveHandler"
      >
        Save
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.form-accreditation-upload-files {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;

  &__header {
    margin-bottom: 20px;
  }

  &__subheader {
    color: $gray-80;
    margin-bottom: 40px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 40px;
    margin-bottom: 44px;
  }

  &__info {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 32px;
    align-self: stretch;
    margin-bottom: 40px;
    @media screen and (max-width: $desktop-md){
      flex-direction: column;
      gap: 20px;
    }
  }

  &__info-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    flex: 1 0 0;
  }

  &__info-list {
    color: $gray-80;
    list-style-type: disc;
    padding-left: 15px;
  }
}
</style>
