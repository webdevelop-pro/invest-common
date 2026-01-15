<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import InfoSlot from 'UiKit/components/VInfo/VInfoSlot.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import EarnDepositCard from './EarnDepositCard.vue';
import { useEarnTopInfo, type InfoDataItem } from './composables/useEarnTopInfo';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';

interface Props {
  poolData?: DefiLlamaYieldPoolFormatted;
  loading?: boolean;
  infoData?: InfoDataItem[];
  profileId?: string | number;
  coinBalance?: number;
  walletLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  infoData: () => [],
  walletLoading: false,
});

const emit = defineEmits<{
  (e: 'back-click'): void;
  (e: 'exchange-click'): void;
}>();

const {
  defaultSymbol,
  hasPoolData,
  displayInfoData,
} = useEarnTopInfo(props);
</script>

<template>
  <div class="EarnTopInfo earn-top-info">
    <div class="earn-top-info__button-wrap">
      <VButton
        variant="link"
        size="large"
        icon-placement="left"
        @click.stop="emit('back-click')"
      >
        <arrowLeft
          alt="Back to Earn"
          class="earn-top-info__back-icon"
        />
        Back to Earn
      </VButton>
    </div>
    <div class="earn-top-info__content is--gap-80">
      <div class="earn-top-info__left">
        <div class="earn-top-info__header">
          <div>
            <VSkeleton
              v-if="loading"
              height="21px"
              width="100px"
              class="earn-top-info__skeleton"
            />
            <div
              v-else-if="hasPoolData"
              class="earn-top-info__symbol-title is--h6__title"
            >
              {{ poolData?.project }}
            </div>
            <VSkeleton
              v-if="loading"
              height="40px"
              width="200px"
              class="earn-top-info__skeleton"
            />
            <div
              v-else-if="hasPoolData"
              class="earn-top-info__project is--h3__title"
            >
              {{ poolData?.symbol }}
            </div>
          </div>
        </div>
        <InfoSlot
          v-if="displayInfoData.length > 0 || loading"
          size="small"
          class="earn-top-info__info-wrap"
        >
          <span
            v-for="(info, infoIndex) in displayInfoData"
            :key="`${info.text}-${infoIndex}`"
            class="earn-top-info__info-item"
          >
            <span class="earn-top-info__info-text is--small-2">
              {{ info.text }}
            </span>
            <VSkeleton
              v-if="loading"
              height="18px"
              width="50px"
              class="earn-top-info__skeleton"
            />
            <span
              v-else
              class="earn-top-info__info-value is--small"
            >
              {{ info.value }}
            </span>
          </span>
        </InfoSlot>
      </div>
      <EarnDepositCard
        :loading="loading"
        :symbol="defaultSymbol"
        :pool-id="poolData?.pool"
        :profile-id="profileId"
        :coin-balance="coinBalance"
        :wallet-loading="walletLoading"
        @exchange-click="emit('exchange-click')"
      />
    </div>
  </div>
</template>

<style lang="scss">
.earn-top-info {
  margin: 40px 0 45px;

  &__content {
    display: flex;

    @media screen and (max-width: $desktop) {
      flex-direction: column;
    }
  }

  &__left {
    width: 100%;
  }

  &__button-wrap {
    margin-bottom: 12px;
  }

  &__header {
    width: 100%;
    display: flex;
    justify-content: space-between;

    @media screen and (max-width: $tablet-xs) {
      flex-direction: column;
      gap: 8px;
    }
  }

  &__symbol-title {
    color: $gray-80;
  }

  &__project {
    color: $black;
    margin-bottom: 4px;
  }

  &__info-wrap {
    margin-top: 27px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid $gray-20;
    color: $gray-80;
    width: 100%;

    @media screen and (max-width: $tablet) {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      margin-top: 10px;
      gap: 2px 12px;
    }

    @media screen and (max-width: $mobile-xs) {
      grid-template-columns: 1fr;
    }
  }

  &__info-item {
    align-self: center;
    min-width: 218px;
    display: flex;
    gap: 12px;
    align-items: center;

    @media screen and (max-width: $desktop-lg) {
      min-width: auto;
    }

    @media screen and (max-width: $tablet-xs) {
      justify-content: space-between;
    }
  }

  &__info-text {
    color: $gray-70;
    min-width: 79px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__back-icon {
    width: 20px;
  }
}
</style>

