<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg?component';

interface Props {
  back?: {
    to: RouteLocationRaw | null;
    text?: string;
  } | null;
  cancel?: {
    href: string | null;
    text?: string;
  } | null;
  primary?: {
    text?: string;
    disabled?: boolean;
    loading?: boolean;
    testId?: string;
  } | null;
}

const props = withDefaults(defineProps<Props>(), {
  back: () => ({
    to: null,
    text: 'Back',
  }),
  cancel: () => ({
    href: null,
    text: 'Cancel',
  }),
  primary: () => ({
    text: 'Continue',
    disabled: false,
    loading: false,
    testId: undefined,
  }),
});

const emit = defineEmits<{
  (e: 'primary'): void;
}>();

const hasBack = computed(() => Boolean(props.back?.to));
const hasCancel = computed(() => Boolean(props.cancel?.href));
</script>

<template>
  <div class="InvestStepFooter invest-step-footer is--margin-top-20">
    <VButton
      v-if="hasBack"
      variant="link"
      size="large"
      as="router-link"
      :to="back?.to!"
      class="is--gt-tablet-show"
    >
      <arrowLeft
        alt="arrow left"
        class="invest-step-footer__back-icon"
      />
      {{ back?.text ?? 'Back' }}
    </VButton>

    <div
      class="invest-step-footer__btn"
      :class="{ 'is--full-width': !hasBack }"
    >
      <VButton
        v-if="hasBack"
        variant="link"
        size="large"
        as="router-link"
        :to="back?.to!"
        class="is--lt-tablet-show"
      >
        <arrowLeft
          alt="arrow left"
          class="invest-step-footer__back-icon"
        />
        {{ back?.text ?? 'Back' }}
      </VButton>
      <VButton
        v-if="hasCancel"
        variant="outlined"
        size="large"
        as="a"
        :href="cancel?.href!"
      >
        {{ cancel?.text ?? 'Cancel' }}
      </VButton>
      <VButton
        :disabled="primary?.disabled"
        :loading="primary?.loading"
        size="large"
        :data-testid="primary?.testId"
        class="invest-step-footer__primary"
        @click="emit('primary')"
      >
        {{ primary?.text ?? 'Continue' }}
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.invest-step-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;

    &.is--full-width {
      width: 100%;
    }

    @media screen and (width < $tablet){
      justify-content: space-between;
      width: 100%;
    }
  }

  &__back-icon {
    width: 20px;
  }

  &__primary {
    @media screen and (width < $tablet){
      width: 100%;
      order: -1;
    }
  }
}
</style>
