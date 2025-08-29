import { useRoute, useRouter } from 'vue-router';
import {
  computed, onBeforeMount, onMounted, ref, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { InvestStepTypes } from 'InvestCommon/types/api/invest';
import {
  ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP, ROUTE_INVEST_REVIEW,
  ROUTE_INVEST_SIGNATURE,
} from 'InvestCommon/domain/config/enums/routes';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';


interface Props {
  title?: string;
  stepNumber: number;
}

// Move configuration outside component to prevent recreation
const INVEST_STEPS_CONFIG = {
  [InvestStepTypes.amount]: {
    step: 1,
    description: 'Amount',
    value: InvestStepTypes.amount,
    to: { name: ROUTE_INVEST_AMOUNT },
  },
  [InvestStepTypes.ownership]: {
    step: 2,
    description: 'Ownership',
    value: InvestStepTypes.ownership,
    to: { name: ROUTE_INVEST_OWNERSHIP },
  },
  [InvestStepTypes.signature]: {
    step: 3,
    description: 'Signature',
    value: InvestStepTypes.signature,
    to: { name: ROUTE_INVEST_SIGNATURE },
  },
  [InvestStepTypes.funding]: {
    step: 4,
    description: 'Funding',
    value: InvestStepTypes.funding,
    to: { name: ROUTE_INVEST_FUNDING },
  },
  [InvestStepTypes.review]: {
    step: 5,
    description: 'Confirmation',
    value: InvestStepTypes.review,
    to: { name: ROUTE_INVEST_REVIEW },
  },
} as const;

// Memoized steps array - moved outside computed to prevent recreation
const steps = [
  INVEST_STEPS_CONFIG.amount,
  INVEST_STEPS_CONFIG.ownership,
  INVEST_STEPS_CONFIG.signature,
  INVEST_STEPS_CONFIG.funding,
  INVEST_STEPS_CONFIG.review,
];

export function useInvestStep(props: Props) {
  const route = useRoute();
  const router = useRouter();
  const sessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(sessionStore);
  const investmentRepository = useRepositoryInvestment();

  // Extract route params once with better type safety
  const routeParams = computed(() => {
    const { slug, id, profileId } = route.params;
    return {
      slug: slug as string,
      id: id as string,
      profileId: profileId as string,
    };
  });

  const currentTab = ref(props.stepNumber);
  const isRouteValid = ref(true);

  // Optimized watch with better error handling
  watch(
    currentTab,
    (newTab) => {
      const stepClick = steps.find((item) => item.step === newTab);
      if (stepClick?.to.name) {
        void router.push({
          name: stepClick.to.name,
          params: routeParams.value,
        }).catch((error) => {
          console.error('Navigation failed:', error);
        });
      }
    },
    { immediate: false }
  );

  onBeforeMount(async () => {
    if (userLoggedIn.value && routeParams.value.slug) {
      try {
        const res = await investmentRepository.getInvestUnconfirmed(
          routeParams.value.slug,
          routeParams.value.profileId,
        );
        if (!res) {
          router.push('/dashboard/error/404');
        }
      } catch (error) {
        console.error('Failed to fetch offer:', error);
      }
    }
  });

  onMounted(() => {
    isRouteValid.value = Boolean(routeParams.value.slug);
  });

  return {
    currentTab,
    isRouteValid,
    steps,
    routeParams,
  };
} 