<script setup lang="ts">
import VFormSettingsTOTP from 'InvestCommon/components/forms/ory/VFormSettingsTOTP.vue';
import {
  VDialogContent, VDialogHeader, VDialogTitle, VDialog, VDialogFooter,
} from 'UiKit/components/Base/VDialog';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

const open = defineModel<boolean>();
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="popup"
    query-value="mfa"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="v-dialog-mfa"
    >
      <VDialogHeader>
        <VDialogTitle>
          Enable Multi-Factor Authentication
        </VDialogTitle>
      </VDialogHeader>
      <VFormSettingsTOTP @close="open = false" />
      <VDialogFooter>
        <VButton
          variant="outlined"
          class="v-dialog-mfa__cancel is--margin-top-40"
          @click="open = false"
        >
          Cancel
        </VButton>
      </VDialogFooter>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-mfa {
  padding: 60px 40px 40px;

  &__cancel {
    float: right;
  }
}
</style>
