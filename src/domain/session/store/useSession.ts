import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useCookies } from '@vueuse/integrations/useCookies';
import { cookiesOptions } from 'InvestCommon/domain/config/cookies';
import { ISession } from 'InvestCommon/data/auth/auth.type';

export const useSessionStore = defineStore('userSession', () => {
  const cookies = useCookies(['session']);

  const userSession = ref<ISession | undefined>();
  const isSessionHydrated = ref(false);
  const userLoggedIn = computed(() => Boolean(userSession.value?.active));
  const userSessionTraits = computed(() => userSession.value?.identity?.traits);

  const syncSessionFromCookies = () => {
    userSession.value = cookies.get('session');
    isSessionHydrated.value = true;
  };

  const updateSession = (session: ISession) => {
    userSession.value = session;
    isSessionHydrated.value = true;
    cookies.set(
      'session',
      session,
      cookiesOptions(new Date(session?.expires_at)),
    );
  };

  const resetAll = () => {
    userSession.value = undefined;
    isSessionHydrated.value = true;
    cookies.remove('session', cookiesOptions());
  };

  // TODO: if some error in some ory request -> check if active session
  // check if active session every 15 mins
  // handle multiple tabs/ windows and close session from other window

  return {
    isSessionHydrated,
    resetAll,
    syncSessionFromCookies,
    updateSession,
    userSession,
    userLoggedIn,
    userSessionTraits,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot));
}

/*
Flow cases:
- user login/signup - write session
- user logout - remove session
- error on some ory reqest - ory user logout - remove session
- check if active session every 15 mins
- handle multiple tabs/ windows and close session from other window
*/
