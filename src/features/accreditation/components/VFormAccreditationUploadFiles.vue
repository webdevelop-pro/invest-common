<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VFormAccreditationFileInput from './VFormAccreditationFileInput.vue';
import { useAccreditationUpload } from '../store/useAccreditationUpload';

const accreditationUploadStore = useAccreditationUpload();
const {
  validateTrigger,
} = storeToRefs(accreditationUploadStore);

const { onFilesChange, onModelChange, onValidChange } = accreditationUploadStore;
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
      <VFormAccreditationFileInput
        :validate="validateTrigger"
        @files="onFilesChange"
        @model="onModelChange"
        @valid="onValidChange"
      />
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

  &__info-title {
    color: $black;
  }
}
</style>
