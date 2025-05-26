import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useCookies } from '@vueuse/integrations/useCookies';
import { cookiesOptions } from 'InvestCommon/global/index';
import { ISession } from '@/types/api/auth';

export const useUserSession = defineStore('userSession', () => {
  const cookies = useCookies(['session']);

  const userSession = ref(cookies.get('session'));
  const userLoggedIn = computed(() => Boolean(userSession.value?.active));

  const updateSession = (session: ISession) => {
    userSession.value = session;
    cookies.set(
      'session',
      session,
      cookiesOptions(new Date(session?.expires_at)),
    );
  };

  const resetAll = () => {
    userSession.value = undefined;
    cookies.remove('session', cookiesOptions());
  };

  // TODO: if some error in some ory request -> check if active session
  // check if active session every 15 mins
  // handle multiple tabs/ windows and close session from other window

  return {
    resetAll,
    updateSession,
    userSession,
    userLoggedIn,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserSession, import.meta.hot));
}

/*
Flow cases:
- user login/signup - write session
- user logout - remove session
- error on some ory reqest - ory user logout - remove session
- check if active session every 15 mins
- handle multiple tabs/ windows and close session from other window
*/
