<script setup lang="ts">
import { useAuthLogicStore } from 'InvestCommon/store';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { socialSignin } from './utilsAuth';
import VButton from 'UiKit/components/VButton/VButton.vue';

defineProps({
  signup: Boolean,
});

const authLogicStore = useAuthLogicStore();

const onSocialLoginHandler = async (provider: string) => {
  await authLogicStore.onSocialLogin(provider, SELFSERVICE.login);
};
</script>

<template>
  <div class="VFormAuthSocial social-form  is--no-margin">
    <VButton
      v-for="item in socialSignin"
      :key="item.provider"
      color="secondary"
      size="large"
      block
      class="social-form__item"
      :class="item.classes"
      @click.stop.prevent="onSocialLoginHandler(item.provider)"
    >
      <component
        :is="item.icon"
        :alt="item.classes"
        class="social-form__item-icon"
      />
      <component
        :is="item.iconHover"
        :alt="item.classes"
        class="social-form__item-icon-hover"
      />
    </VButton>
  </div>
</template>

<style lang="scss">
.social-form {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  align-self: stretch;
  width: 100%;

  &__item-icon,
  &__item-icon-hover {
    width: 20px;
    height: 20px;
    transition: all 0.3 ease;
  }

  &__item-icon-hover {
    display: none;
  }

  &__item {
    width: 100%;

    &:hover {
      .social-form__item-icon {
        display: none;
      }
      .social-form__item-icon-hover {
        display: block;
      }
    }
  }
}
</style>
