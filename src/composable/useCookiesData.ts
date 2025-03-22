import { useCookies } from '@vueuse/integrations/useCookies';
import { computed, ref, watch } from 'vue';

export const useCookiesData = () => {
  const sessionData = useCookies(['session']).get('session');
  const expireDate = ref(new Date(sessionData?.session?.expires_at));
  const cookiesOptions = computed(() => ({
    domain: '.webdevelop.biz', sameSite: 'lax', path: '/', expires: expireDate,
  }));

  watch(() => sessionData?.session?.expires_at, () => {
    expireDate.value = sessionData?.session?.expires_at;
  }, { immediate: true });

  return {
    cookiesOptions,
  };
};
