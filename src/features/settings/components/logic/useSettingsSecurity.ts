import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { SessionFormatter } from 'InvestCommon/data/settings/session.formatter';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { IActivityRow, ISession, ISessionFormatted } from 'InvestCommon/data/settings/settings.types';

export function useSettingsSecurity() {
  const userSessionStore = useSessionStore();
  const { userSession } = storeToRefs(userSessionStore);
  const settingsRepository = useRepositorySettings();
  const { getAllSessionState, deleteOneSessionState, deleteAllSessionState } = storeToRefs(settingsRepository);

  const onDeleteId = ref<string>();

  const activityHeader = [
    { text: 'Date' },
    { text: 'Location' },
    { text: 'Browser' },
    { text: 'Action' },
  ];

  const activityBody = computed(() => {
    const currentSession = new SessionFormatter(userSession.value as ISession).format().devicesFormatted;
    // Only mark as current if there are devices in the current session
    if (currentSession.length > 0) {
      (currentSession[0] as IActivityRow).current = true;
    }
    const otherSessions = getAllSessionState.value.data?.flatMap((s: ISessionFormatted) => s.devicesFormatted) || [];
    return [...currentSession, ...otherSessions];
  });

  const onFinishAllSessions = async () => {
    await settingsRepository.deleteAllSession();
    settingsRepository.getAllSession();
  };

  const onDeleteSession = async (id: string) => {
    onDeleteId.value = id;
    await settingsRepository.deleteOneSession(id);
    settingsRepository.getAllSession();
  };

  const initializeSessions = async () => {
    if (!getAllSessionState.value.data) {
      await settingsRepository.getAllSession();
    }
  };

  onMounted(initializeSessions);

  return {
    // State
    getAllSessionState,
    deleteOneSessionState,
    deleteAllSessionState,
    onDeleteId,
    
    // Computed
    activityHeader,
    activityBody,
    
    // Methods
    onFinishAllSessions,
    onDeleteSession,
  };
}
