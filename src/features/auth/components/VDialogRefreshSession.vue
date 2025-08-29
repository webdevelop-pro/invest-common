<script setup lang="ts">
import {
  VDialogContent, VDialog,
} from 'UiKit/components/Base/VDialog';
import { watch } from 'vue';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { storeToRefs } from 'pinia';
import VFormAuthSocial from './VFormAuthSocial.vue';
import VFormAuthLogInRefresh from './VFormAuthLogInRefresh.vue';
import VSeparator from 'UiKit/components/Base/VSeparator/VSeparator.vue';
import { useLoginRefreshStore } from '../store/useLoginRefresh';

const useDialogsStore = useDialogs();
const { isDialogRefreshSessionOpen } = storeToRefs(useDialogsStore);
const loginRefreshStore = useLoginRefreshStore();

const open = defineModel<boolean>();

watch(() => open.value, () => {
  if (!open.value) {
    isDialogRefreshSessionOpen.value = false;
  }
});

const onSocialClick = (event: MouseEvent) => {
  loginRefreshStore.loginSocialHandler(event);
};
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

      <VFormAuthSocial
        class="is--margin-top-20"
        @click="onSocialClick($event)"
      />

      <VSeparator
        label="or"
        class="is--margin-top-30"
      />

      <VFormAuthLogInRefresh
        class="is--margin-top-30"
        @cancel="open = false"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-refresh-session {
  z-index: 1101;

  &__cancel {
    float: right;
  }
}
</style>
