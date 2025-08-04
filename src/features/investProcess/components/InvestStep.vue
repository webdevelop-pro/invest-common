<script setup lang="ts">
import VStepper from 'UiKit/components/VStepper.vue';
import { useInvestStep } from './logic/useInvestStep';

interface Props {
  title?: string;
  stepNumber: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
});

const { currentTab, isRouteValid, steps } = useInvestStep(props);
</script>

<template>
  <div class="InvestStep invest-step is--no-margin">
    <div
      v-if="isRouteValid"
      class="wd-container invest-step__container"
    >
      <aside class="invest-step__side">
        <VStepper
          v-model="currentTab"
          :steps="steps"
          :default-value="currentTab"
          class="invest-step__step"
        />
      </aside>
      <section class="invest-step__main">
        <h1 class="invest-step__title">
          {{ title }}
        </h1>
        <slot />
      </section>
    </div>

    <p
      v-else
      class="invest-step__not-found"
    >
      Investment not found
    </p>
  </div>
</template>

<style lang="scss">
.invest-step {
  width: 100%;

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
  }

  &__not-found {
    text-align: center;
    font-size: 20px;

    strong {
      font-weight: 800;
    }
  }
}
</style>
