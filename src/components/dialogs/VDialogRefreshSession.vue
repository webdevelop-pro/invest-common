<script setup lang="ts">
import VFormSettingsTOTP from 'InvestCommon/components/forms/ory/VFormSettingsTOTP.vue';
import {
  VDialogContent, VDialogHeader, VDialogTitle, VDialog, VDialogFooter,
} from 'UiKit/components/Base/VDialog';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { watch } from 'vue';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { storeToRefs } from 'pinia';
import VFormAuthSocial from 'InvestCommon/components/forms/ory/VFormAuthSocial.vue';
import VFormAuthLogIn from 'InvestCommon/components/forms/ory/VFormAuthLogIn.vue';
import VSeparator from 'UiKit/components/Base/VSeparator/VSeparator.vue';

const useDialogsStore = useDialogs();
const { isDialogRefreshSessionOpen } = storeToRefs(useDialogsStore);

const open = defineModel<boolean>();

watch(() => open.value, () => {
  if (!open.value) {
    isDialogRefreshSessionOpen.value = false;
  }
});
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="popup"
    query-value="security-check"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="VDialogRefreshSession v-dialog-refresh-session"
    >
      <h2>
        Security Check
      </h2>
      <p class="is--margin-top-20 is--color-black">
        Before this action we need to verify your identity. Please log in with your existing credentials.
      </p>

      <VFormAuthSocial class="is--margin-top-20" />

      <VSeparator
        label="or"
        class="is--margin-top-30"
      />

      <VFormAuthLogIn
        refresh
        class="is--margin-top-30"
        @cancel="open = false"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-refresh-session {
  text-align: center;
  &__cancel {
    float: right;
  }
}
</style>
