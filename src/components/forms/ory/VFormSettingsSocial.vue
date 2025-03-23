<script setup lang="ts">
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { socialSignin } from './utilsAuth';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { onMounted, ref } from 'vue';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';

const authStore = useAuthStore();
const authLogicStore = useAuthLogicStore();

const data = ref(socialSignin.map((item) => ({
  ...item,
  linked: false,
})));

const onSocialLoginHandler = async (provider: string, toLink: boolean) => {
  const dataToSend = toLink ? { link: provider } : { unlink: provider };
  await authLogicStore.onSettingsSocial(SELFSERVICE.settings, dataToSend);
};

onMounted(async () => {
  await authStore.fetchAuthHandler(SELFSERVICE.settings);
});
</script>

<template>
  <div class="VFormSettingsSocial social-form">
    <VButton
      v-for="item in data"
      :key="item.provider"
      variant="tetriary"
      size="large"
      class="social-form__item"
      :class="item.classes"
      @click.stop.prevent="onSocialLoginHandler(item.provider, !item.linked)"
    >
      {{ item.linked ? 'Unlink ' : 'Link ' }}
      {{ item.provider }}
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

  &__item-icon-hover {
    display: none;
  }

  &__item {
    flex: 1 1 auto;

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
