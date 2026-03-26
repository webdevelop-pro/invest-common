<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { urlHome } from 'InvestCommon/domain/config/links';

type OfflinePageAction = {
  label: string;
  href?: string | null;
  to?: RouteLocationRaw | null;
};

const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  footerText?: string;
  secondaryAction?: OfflinePageAction | null;
}>(), {
  title: 'You\'re currently offline',
  description: 'Invest PRO needs an internet connection to refresh your data. Check your network settings and try again when you\'re back online.',
  footerText: 'Reconnect to continue your Invest PRO journey.',
  secondaryAction: () => ({
    label: 'Go to home',
    href: urlHome,
  }),
});

const reloadPage = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

const logoSrc = '/images/logo.svg';
const illustrationSrc = '/images/icons/not-found-icon.svg';
</script>

<template>
  <section
    class="VOfflinePageState v-offline-page-state"
    data-testid="offline-page-state"
  >
    <div class="v-offline-page-state__page">
      <header class="v-offline-page-state__header">
        <div class="v-offline-page-state__brand">
          <img
            :src="logoSrc"
            alt="Invest PRO"
            class="v-offline-page-state__brand-logo"
          >
          <span class="v-offline-page-state__brand-text">Invest PRO</span>
        </div>
        <span class="v-offline-page-state__badge">offline</span>
      </header>

      <div class="v-offline-page-state__content">
        <div class="v-offline-page-state__copy">
          <h1 class="v-offline-page-state__title">
            {{ props.title }}
          </h1>
          <p class="v-offline-page-state__description">
            {{ props.description }}
          </p>

          <div class="v-offline-page-state__actions">
            <button
              type="button"
              class="v-offline-page-state__button"
              @click="reloadPage"
            >
              Try again
            </button>

            <component
              :is="props.secondaryAction?.to ? 'router-link' : 'a'"
              v-if="props.secondaryAction"
              class="v-offline-page-state__link"
              :to="props.secondaryAction.to ?? undefined"
              :href="props.secondaryAction.href ?? undefined"
            >
              {{ props.secondaryAction.label }}
            </component>
          </div>
        </div>

        <img
          :src="illustrationSrc"
          alt=""
          class="v-offline-page-state__illustration"
        >
      </div>

      <p class="v-offline-page-state__footer">
        {{ props.footerText }}
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.v-offline-page-state {
  width: 100%;
  padding: 100px 0;
  display: flex;
  justify-content: center;
  background: radial-gradient(80% 80% at 50% 20%, rgb(105 125 255 / 12%), transparent 65%);

  &__page {
    width: min(100%, 720px);
    background: rgb(255 255 255 / 85%);
    backdrop-filter: blur(18px);
    border-radius: 24px;
    padding: 48px 40px;
    box-shadow: 0 28px 80px rgb(15 23 42 / 12%);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__brand-logo {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  &__brand-text {
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: #101828;
  }

  &__badge {
    color: #475467;
    font-size: 0.95rem;
    text-transform: lowercase;
  }

  &__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 220px);
    gap: 24px;
    align-items: center;
  }

  &__title {
    margin: 0 0 16px;
    font-size: 2.25rem;
    line-height: 1.15;
    color: #101828;
  }

  &__description {
    margin: 0 0 24px;
    line-height: 1.6;
    font-size: 1.05rem;
    color: #475467;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  &__button,
  &__link {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 12px 28px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      background 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;
  }

  &__button {
    border: none;
    background: linear-gradient(135deg, #1e3a8a, #6366f1);
    color: #fff;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 32px rgb(79 70 229 / 28%);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 6px 18px rgb(79 70 229 / 40%);
    }
  }

  &__link {
    border: 2px solid rgb(79 70 229 / 20%);
    background: rgb(99 102 241 / 8%);
    color: #1d3a8a;

    &:hover {
      transform: translateY(-2px);
      border-color: rgb(79 70 229 / 35%);
      background: rgb(99 102 241 / 14%);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__illustration {
    width: 200px;
    max-width: 100%;
    justify-self: center;
  }

  &__footer {
    margin: 32px 0 0;
    color: #98a2b3;
    font-size: 0.875rem;
    text-align: center;
  }

  @media screen and (max-width: $tablet) {
    &__page {
      padding: 32px 24px;
    }

    &__header {
      margin-bottom: 24px;
    }

    &__content {
      grid-template-columns: 1fr;
    }

    &__illustration {
      order: -1;
      width: 160px;
    }

    &__title {
      font-size: 2rem;
    }

    &__actions {
      flex-direction: column;
      align-items: stretch;
    }

    &__button,
    &__link {
      width: 100%;
    }
  }
}
</style>
