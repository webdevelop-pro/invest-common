<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import VStepper from 'UiKit/components/VStepper.vue';
import InvestStepFooter from 'InvestCommon/features/investProcess/components/InvestStepFooter.vue';
import { useInvestStep } from './logic/useInvestStep';

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

const { currentTab, steps, maxAvailableStep } = useInvestStep(props);

const hasFooter = computed(() => {
  const footer = props.footer;
  if (!footer) return false;
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
