<script setup lang="ts">
type TickerItem = {
  id: string;
  name: string;
  priceUsd: number;
  change24h: number;
};

const props = defineProps<{
  items: TickerItem[];
  loading?: boolean;
  error?: string;
  durationSec?: number;
}>();
</script>

<template>
  <div class="CryptoPricesTicker crypto-prices-ticker">
    <div
      v-if="props.loading"
      class="crypto-prices-ticker__status is--small"
    >
      Loading crypto prices...
    </div>
    <div
      v-else-if="props.error"
      class="crypto-prices-ticker__status is--small is--error"
    >
      {{ props.error || 'Error loading crypto prices' }}
    </div>
    <div
      v-else
      class="crypto-prices-ticker__marquee"
    >
      <div
        class="crypto-prices-ticker__track"
        :style="{ '--duration': (props.durationSec || 80) + 's' }"
      >
        <div
          v-for="i in 2"
          :key="i"
          class="crypto-prices-ticker__slide"
        >
          <div
            v-for="item in props.items"
            :key="item.id + i"
            class="crypto-prices-ticker__item"
            :class="{ 'is--up': item.change24h >= 0, 'is--down': item.change24h < 0 }"
          >
            <div class="crypto-prices-ticker__price is--small">
              ${{ item.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}
            </div>
            <div class="crypto-prices-ticker__value">
              <span class="crypto-prices-ticker__name">
                {{ item.name }}
              </span>
              <span
                class="crypto-prices-ticker__change is--small"
              >
                <span class="crypto-prices-ticker__change-arrow">{{ item.change24h >= 0 ? '▲' : '▼' }}</span>
                {{ Math.abs(item.change24h).toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.crypto-prices-ticker {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__status {
    color: $gray-70;
  }

  &__marquee {
    overflow: hidden;
    mask-image: linear-gradient(90deg, rgb(0 0 0 / 0%) 0, #000 40px, #000 calc(100% - 40px), rgb(0 0 0 / 0%) 100%);
  }

  &__track {
    display: flex;
    width: max-content;
    user-select: none;
    white-space: nowrap;
    will-change: transform;
    animation: ticker var(--duration) linear infinite;
  }

  &__slide {
    display: inline-flex;
    white-space: nowrap;
  }

  &__item {
    display: inline-flex;
    justify-content: center;
    align-items: start;
    flex-direction: column;
    padding: 0 16px;
    border-right: 1px solid $gray-20;
  }

  &__item.is--up {
    .crypto-prices-ticker__price,
    .crypto-prices-ticker__change {
      color: $secondary;
    }
  }

  &__item.is--down {
    .crypto-prices-ticker__price,
    .crypto-prices-ticker__change {
      color: $red;
    }
  }

  &__value {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  &__change {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: currentcolor;
  }

  &__change-arrow {
    font-size: 12px;
    line-height: 1;
  }
}

@keyframes ticker {
  0% { transform: translate3d(0, 0, 0); }

  100% { transform: translate3d(-50%, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .crypto-prices-ticker__track {
    animation: none !important;
  }
}
</style>


