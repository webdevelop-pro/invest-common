<script setup lang="ts">
import { onUnmounted, watch } from 'vue';
import ContactUsForm from 'UiKit/components/VForms/VFormContactUs.vue';
import {
  VDialogContent, VDialogHeader, VDialogTitle, VDialog,
} from 'UiKit/components/Base/VDialog';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/domain/config/env';

const open = defineModel<boolean>('open');

defineProps({
  subject: String,
});

const sessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(sessionStore);

const clearContactUsQueryParams = () => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  ['name', 'email', 'subject'].forEach((key) => {
    url.searchParams.delete(key);
  });
  window.history.replaceState(null, '', url.toString());
};

watch(open, (isOpen) => {
  if (!isOpen) {
    clearContactUsQueryParams();
  }
});

onUnmounted(() => {
  clearContactUsQueryParams();
});
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="popup"
    query-value="contact-us"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="v-dialog-contact-us"
    >
      <VDialogHeader>
        <VDialogTitle>
          Contact Us
        </VDialogTitle>
      </VDialogHeader>
      <ContactUsForm
        is-in-dialog
        :subject="subject"
        :user-session-traits="userSessionTraits"
        :hubspot-form-id="env.HUBSPOT_FORM_ID_CONTACT_US"
        class="is--margin-top-40 v-dialog-contact-us__form"
        @close="open = false"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-contact-us {
  text-align: center;

  &__form {
    padding: 0 10px 60px;
  }
}
</style>
