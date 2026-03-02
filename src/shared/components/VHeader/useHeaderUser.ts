import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/config/env';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

const { FILER_URL } = env;

export function useHeaderUser() {
  const sessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(sessionStore);

  const profilesRepository = useRepositoryProfiles();
  const { getUserState } = storeToRefs(profilesRepository);

  const userEmail = computed(() => userSessionTraits.value?.email);
  const imageID = computed<number | null | undefined>(
    () => getUserState.value.data?.image_link_id as number | null | undefined,
  );

  const avatarSrc = computed<string | undefined>(() => {
    const id = imageID.value;
    if (!id || id <= 0) {
      return undefined;
    }

    return `${FILER_URL}/auth/files/${id}?size=small`;
  });

  return {
    userEmail,
    imageID,
    avatarSrc,
  };
}

