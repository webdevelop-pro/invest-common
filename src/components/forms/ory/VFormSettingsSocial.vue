<script setup lang="ts">
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { socialSignin } from './utilsAuth';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { computed, onMounted, ref } from 'vue';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { urlSettings, urlSignin } from 'InvestCommon/global/links';
import { navigateWithQueryParams } from 'UiKit/helpers/general';

const authLogicStore = useAuthLogicStore();

const data = ref(socialSignin.map((item) => ({
  ...item,
  linked: false,
})));

const queryType = computed(() => {
  if (import.meta.env.SSR) return null;
  return (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('type') : null;
});

const onSocialLoginHandler = async (provider: string, toLink: boolean) => {
  const dataToSend = toLink ? { link: provider } : { unlink: provider };
  await authLogicStore.onSettingsSocial(SELFSERVICE.settings, dataToSend);
};

onMounted(() => {
  if (queryType.value?.includes('link') || queryType.value?.includes('unlink') || queryType.value?.includes('social')) {
    onSocialLoginHandler(queryType.value, true);
  }
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
