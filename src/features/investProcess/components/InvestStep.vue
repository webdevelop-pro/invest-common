<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute } from 'vue-router';
import VStepper from 'UiKit/components/VStepper.vue';
import InvestStepFooter from 'InvestCommon/features/investProcess/components/InvestStepFooter.vue';
import { useInvestStep } from './logic/useInvestStep';
import VOfflineDataUnavailable from 'InvestCommon/shared/components/pwa/VOfflineDataUnavailable.vue';
import { urlOfferSingle, urlProfilePortfolio } from 'InvestCommon/domain/config/links';

interface Props {
  title?: string;
  stepNumber: number;
  isLoading?: boolean;
  footer?: {
    back?: {
      to: RouteLocationRaw | null;
      text?: string;
    } | null;
    cancel?: {
      href: string | null;
      text?: string;
    } | null;
    primary?: {
      text: string;
      disabled?: boolean;
      loading?: boolean;
      testId?: string;
    } | null;
  } | null;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  isLoading: false,
  footer: () => ({
    back: {
      to: null,
      text: 'Back',
    },
    cancel: {
      href: null,
      text: 'Cancel',
    },
    primary: {
      text: '',
      disabled: false,
      loading: false,
      testId: undefined,
    },
  }),
});

const emit = defineEmits<{
  (e: 'footerPrimary'): void;
}>();

const { currentTab, steps, maxAvailableStep, isOfflineUnavailable } = useInvestStep(props);
const route = useRoute();
const fallbackPortfolioRoute = computed<RouteLocationRaw | null>(() => {
  const profileId = Number(route.params.profileId);
  if (!Number.isFinite(profileId) || profileId <= 0) {
    return null;
  }

  return {
    path: urlProfilePortfolio(profileId),
  };
});
const fallbackOfferHref = computed(() => {
  const slug = String(route.params.slug ?? '');
  return slug ? urlOfferSingle(slug) : null;
});

const hasFooter = computed(() => {
  const footer = props.footer;
  if (!footer || isOfflineUnavailable.value) return false;
  return Boolean(footer.primary?.text ?? footer.back?.to ?? footer.cancel?.href);
});
</script>

<template>
  <div
    class="InvestStep invest-step is--no-margin"
    :class="{ 'is--loading': isLoading }"
  >
    <div
      class="wd-container invest-step__container"
    >
      <aside class="invest-step__side">
        <VStepper
          v-model="currentTab"
          :steps="steps"
          :default-value="currentTab"
          :max-available-step="maxAvailableStep"
          class="invest-step__step"
        />
      </aside>
      <section class="invest-step__main">
        <VOfflineDataUnavailable
          v-if="isOfflineUnavailable"
          title="Investment flow unavailable offline"
          description="This investment flow has not been cached on this device yet. Reconnect to load the latest step data, or return to a previously visited page. The app stays in read-only mode while you are offline."
          :primary-action="fallbackPortfolioRoute ? { label: 'Back to Portfolio', to: fallbackPortfolioRoute } : null"
          :secondary-action="fallbackOfferHref ? { label: 'Back to Offer', href: fallbackOfferHref } : null"
        />
        <template v-else>
          <h1 class="invest-step__title">
            {{ title }}
          </h1>
          <slot />
          <InvestStepFooter
            v-if="hasFooter"
            :back="footer?.back"
            :cancel="footer?.cancel"
            :primary="footer?.primary"
            @primary="emit('footerPrimary')"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<style lang="scss">
.invest-step {
  $root: &;

  width: 100%;

  &.is--loading {
    cursor: wait !important;
  }

  &__container {
    gap: 40px;
    width: 100%;
    display: flex;
    align-items: flex-start;

    @media screen and (max-width: $tablet) {
      flex-direction: column;
      gap: 0;
    }
  }

  &__side {
    display: flex;
    width: 22%;
    padding: 80px 40px 40px 0;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;
    align-self: stretch;
    background: $gray-10;
    position: relative;

    @media screen and (max-width: $tablet) {
      padding: 60px 0 20px;
      width: 100%;
      overflow: auto;
    }

    &::before {
      content: '';
      position: absolute;
      height: 100%;
      top: 0;
      background: $gray-10;
      right: 100%;
      width: 1000%;

      @media screen and (max-width: $tablet) {
        right: 0;
      }
    }
  }

  &__main {
    width: 78%;
    display: flex;
    padding: 40px 0 130px;
    flex-direction: column;
    gap: 40px;
    overflow: auto;

    @media screen and (max-width: $tablet) {
      width: 100%;
      gap: 20px;
    }

    #{$root}.is--loading & {
      opacity: 0.5;
      pointer-events: none;
    }
  }
}
</style>
