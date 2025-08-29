<script setup lang="ts">
import VAccountPhoto from 'InvestCommon/features/filer/VAccountPhoto.vue';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import VFormPartialAccount from './components/VFormPartialAccount.vue';
import { useSettingsAccountDetails } from './logic/useSettingsAccountDetails';

const {
  isLoading,
  isDisabledButton,
  userData,
  breadcrumbs,
  backButtonText,
  backButtonRoute,
  onUploadId,
  handleSave,
  getUserState,
} = useSettingsAccountDetails();
</script>

<template>
  <div class="ViewSettingsAccountDetails view-settings-account-details is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      :button-route="backButtonRoute"
      @save="handleSave"
    >
      <h1 class="is--color-black">
        Account Details
      </h1>
      <VAccountPhoto
        class="is--margin-top-40"
        :image-id="Number(getUserState.data?.image_link_id)"
        :user-id="Number(getUserState.data?.id)"
        :loading="getUserState.loading"
        @upload-id="onUploadId"
      />
      <div class="is--margin-top-30 VFormAccount">
        <VFormPartialAccount
          ref="personalFormChild"
          :model-data="userData"
        />
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-settings-account-details {
  width: 100%;
}
</style>
