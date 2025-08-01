<script setup lang="ts">
import VFormAuthSocial from './components/VFormAuthSocial.vue';
import VFormAuthLogIn from './components/VFormAuthLogIn.vue';
import VSeparator from 'UiKit/components/Base/VSeparator/VSeparator.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useLoginStore } from './store/useLogin';
import { onMounted } from 'vue';

useGlobalLoader().hide();

const loginStore = useLoginStore();
const onSocialClick = (provider: string) => {
  loginStore.loginSocialHandler(provider);
};

onMounted(() => {
  loginStore.onMountedHandler();
});
</script>

<template>
  <div class="ViewLogIn view-login">
    <div class="view-login__wrap">
      <h1 class="view-login__title">
        Log In
      </h1>

      <VFormAuthSocial
        class="view-login__social"
        @click="onSocialClick($event)"
      />

      <VSeparator
        label="or"
        class="view-login__separator"
      />

      <VFormAuthLogIn />
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-login {
  width: 100%;
  padding-top: $header-height;
  min-height: 100vh;

  &__wrap {
    max-width: 558px;
    margin: 40px auto 130px;

    @media screen and (width < $tablet){
      margin: 40px auto 100px;
      padding: 0 15px;
    }
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
