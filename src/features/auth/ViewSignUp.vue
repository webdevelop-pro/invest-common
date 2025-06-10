<script setup lang="ts">
import VFormAuthSocial from './components/VFormAuthSocial.vue';
import VFormAuthSignUp from './components/VFormAuthSignUp.vue';
import VSeparator from 'UiKit/components/Base/VSeparator/VSeparator.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { computed } from 'vue';
import { useSignupStore } from './store/useSignup';
import { storeToRefs } from 'pinia';

useGlobalLoader().hide();

const signupStore = useSignupStore();
const { title, queryFlow } = storeToRefs(signupStore);
const onSocialClick = (provider: string) => {
  signupStore.signupSocialHandler(provider);
};
</script>

<template>
  <div class="ViewSignUp view-signup">
    <div class="view-signup__wrap">
      <h1 class="view-signup__title">
        {{ title }}
      </h1>

      <VFormAuthSocial
        v-if="!queryFlow"
        @click="onSocialClick($event)"
      />
      <VSeparator
        v-if="!queryFlow"
        label="or"
        class="view-signup__separator"
      />
      <VFormAuthSignUp />
    </div>
  </div>
</template>

<style lang="scss">
.view-signup {
  width: 100%;
  padding-top: $header-height;
  min-height: 100vh;

  &__wrap {
    max-width: 558px;
    margin: 40px auto 130px;
  }

  &__title {
    text-align: center;
    margin-bottom: 40px;
  }

  &__separator {
    margin: 30px 0;
  }
}
</style>
