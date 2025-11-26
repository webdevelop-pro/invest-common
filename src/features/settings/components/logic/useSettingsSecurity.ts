import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { SessionFormatter } from 'InvestCommon/data/settings/session.formatter';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { IActivityRow, ISession, ISessionFormatted } from 'InvestCommon/data/settings/settings.types';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';

export function useSettingsSecurity() {
  const userSessionStore = useSessionStore();
  const { userSession } = storeToRefs(userSessionStore);
  const settingsRepository = useRepositorySettings();
  const { getAllSessionState, deleteOneSessionState, deleteAllSessionState } = storeToRefs(settingsRepository);

  const onDeleteId = ref<string>();
  const dialogsStore = useDialogs();

  const activityHeader = [
    { text: 'Date' },
    { text: 'Location' },
    { text: 'Browser' },
    { text: 'Action' },
  ];

  const activityBody = computed(() => {
    const currentSession = new SessionFormatter(userSession.value as ISession).format().devicesFormatted;
    // Mark all current session devices as current
    if (currentSession.length > 0) {
      currentSession.forEach((device: IActivityRow) => {
        device.current = true;
      });
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

  const onContactUsClick = () => {
    dialogsStore.openContactUsDialog('report an issue');
  };

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
    onContactUsClick,
  };
}
