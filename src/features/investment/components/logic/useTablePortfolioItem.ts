import { computed, onMounted, ref, watch, type Ref, isRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSyncWithUrl } from 'UiKit/composables/useSyncWithUrl';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';

interface UseTablePortfolioItemProps {
  item: Ref<IInvestmentFormatted> | IInvestmentFormatted;
  activeId?: Ref<number> | number;
}

export function useTablePortfolioItem(props: UseTablePortfolioItemProps) {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData } = storeToRefs(profilesStore);

  // Unwrap refs to make them reactive
  const item = computed(() => isRef(props.item) ? props.item.value : props.item);
  const activeId = computed(() => props.activeId ? (isRef(props.activeId) ? props.activeId.value : props.activeId) : undefined);

  const isOpenId = useSyncWithUrl<number>({
    key: 'id',
    defaultValue: 0,
    parse: (val: string | null) => {
      if (!val) return 0;
      const num = Number(val);
      return Number.isNaN(num) ? 0 : num;
    },
  });

  const scrollTarget = computed(() => `scrollTarget${item.value?.id}`);
  const isDialogTransactionOpen = ref(false);
  const isDialogWireOpen = ref(false);
  const isDialogCancelOpen = ref(false);

  const userName = computed(() => `${selectedUserProfileData.value?.data?.first_name || ''} ${selectedUserProfileData.value?.data?.last_name || ''}`);
  const isActiveId = computed(() => (item.value.id === activeId.value));

  const onFundingType = () => {
    if (!item.value.isFundingClickable) return;
    if (item.value.isFundingTypeWire) isDialogWireOpen.value = true;
    else isDialogTransactionOpen.value = true;
  };

  onMounted(() => {
    setTimeout(() => {
      if (activeId.value && (item.value.id === activeId.value)) {
        const target = document.getElementById(scrollTarget.value);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 200);
  });

  return {
    scrollTarget,
    isDialogTransactionOpen,
    isDialogWireOpen,
    isDialogCancelOpen,
    userName,
    isActiveId,
    onFundingType,
    isOpenId,
  };
}
