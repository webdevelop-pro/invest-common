<script setup lang="ts">
import { useData } from 'vitepress';
import ContactUsForm from 'UiKit/components/VForms/VFormContactUs.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/domain/config/env';

const { frontmatter } = useData();

const sessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(sessionStore);

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewContactUs view-contact-us is--page">
    <div class="is--container">
      <div class="view-contact-us__wrap">
        <h1 class="view-contact-us__title">
          {{ frontmatter.title }}
        </h1>

        <ContactUsForm
          :user-session-traits="userSessionTraits"
          :hubspot-form-id="env.HUBSPOT_FORM_ID_CONTACT_US"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.view-contact-us {
  width: 100%;
  overflow: hidden;

  &__wrap {
    max-width: 753px;
    margin: 0 auto;
  }

  &__title {
    text-align: center;
    margin-bottom: 40px;
  }
}
</style>
