<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import InfoSlot from 'UiKit/components/VInfo/VInfoSlot.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import externalLink from 'UiKit/assets/images/external-link.svg';
import { urlOfferSingle } from 'InvestCommon/domain/config/links';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { useInvestmentTopInfo } from './logic/useInvestmentTopInfo';
import VTooltip from 'UiKit/components/VTooltip.vue';

const VDialogContactUs = defineAsyncComponent({
  loader: () => import('InvestCommon/shared/components/dialogs/VDialogContactUs.vue'),
});
const VDialogPortfolioTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/features/investment/components/VDialogPortfolioTransaction.vue'),
});
const VDialogPortfolioWire = defineAsyncComponent({
  loader: () => import('InvestCommon/features/investment/components/VDialogPortfolioWire.vue'),
});
const VDialogPortfolioCancelInvestment = defineAsyncComponent({
  loader: () => import('InvestCommon/features/investment/components/VDialogPortfolioCancelInvestment.vue'),
});

const props = defineProps({
  investmentId: {
    type: String,
    required: true,
  },
  profileData: Object,
});

const {
  getInvestOneState,
  getInvestOneData,
  userName,
  infoData,
  isDialogTransactionOpen,
  isDialogWireOpen,
  isDialogContactUsOpen,
  isDialogCancelOpen,
  onBackClick,
  onCancelInvestmentClick,
  onFundingType,
  onContactUsClick,
} = useInvestmentTopInfo(props);
</script>

<template>
  <div class="InvestmentTopInfo investment-top-info">
    <div class="investment-top-info__button-wrap">
      <VButton
        variant="link"
        size="large"
        icon-placement="left"
        @click.stop="onBackClick"
      >
        <arrowLeft
          alt="arrow left"
          class="investment-top-info__back-icon"
        />
        Back to Portfolio
      </VButton>
    </div>
    <div class="investment-top-info__content">
      <div class="investment-top-info__left">
        <VSkeleton
          v-if="getInvestOneState.loading"
          height="190px"
          width="361px"
          class="investment-top-info__skeleton"
        />
        <div
          v-else
          class="investment-top-info__img-wrap"
        >
          <VImage
            :src="getInvestOneState.data?.offer?.imageMedium"
            :alt="getInvestOneData?.offer?.name"
            class="investment-top-info__img"
            :class="{
              'is--default-image': getInvestOneState.data?.offer?.isDefaultImage,
            }"
            data-testid="offer-image"
          />
        </div>
        <VBadge
          v-if="getInvestOneData?.statusFormatted.text"
          :color="getInvestOneData?.statusFormatted.color"
          class="investment-top-info__status"
        >
          {{ getInvestOneData?.statusFormatted.text }}
        </VBadge>
      </div>
      <div class="investment-top-info__right">
        <div class="investment-top-info__righ-top">
          <div>
            <VSkeleton
              v-if="getInvestOneState.loading"
              height="21px"
              width="100px"
              class="investment-top-info__skeleton"
            />
            <div
              v-else
              class="investment-top-info__id is--h6__title"
            >
              ID {{ investmentId }}
            </div>
            <VSkeleton
              v-if="getInvestOneState.loading"
              height="40px"
              width="200px"
              class="investment-top-info__skeleton"
            />
            <div
              v-else
              class="investment-top-info__name is--h3__title"
            >
              {{ getInvestOneData?.offer?.name }}
              <a
                v-if="getInvestOneData?.offer?.slug"
                :href="urlOfferSingle(getInvestOneData?.offer?.slug)"
                target="_blank"
                rel="noopener noreferrer"
                class="investment-top-info__offer-link"
              >
                <externalLink
                  alt="external link icon"
                  class="investment-top-info__offer-link-icon"
                />
                <span class="is--hidden">
                  Offer {{ getInvestOneData?.offer?.name }} link
                </span>
              </a>
            </div>
            <VSkeleton
              v-if="getInvestOneState.loading"
              height="36px"
              width="200px"
              class="investment-top-info__skeleton"
            />
            <div
              v-else
              class="investment-top-info__investment"
            >
              <span class="is--subheading-1">
                {{ getInvestOneData?.amountFormatted }}
              </span>
              <div class="investment-top-info__shares">
                <span class="is--small">
                  {{ getInvestOneData?.numberOfSharesFormatted }} shares
                </span>
                <span class="is--small">
                  {{ getInvestOneData?.pricePerShareFormatted }} per share
                </span>
              </div>
            </div>
          </div>
          <div class="investment-top-info__buttons">
            <VButton
              size="small"
              variant="link"
              class="investment-top-info__button"
              @click.stop="onContactUsClick"
            >
              Contact Us
            </VButton>
            <VButton
              size="small"
              variant="link"
              color="red"
              class="investment-top-info__button"
              @click.stop="onCancelInvestmentClick"
            >
              Cancel Investment
            </VButton>
          </div>
        </div>
        <InfoSlot
          size="small"
          class="investment-top-info__info-wrap"
        >
          <VTooltip
            v-for="(info, infoIndex) in infoData"
            :key="infoIndex"
            :disabled="!info.tooltip"
          >
            <span
              class="investment-top-info__info-item"
            >
              <span class="investment-top-info__info-text is--small-2">
                {{ info.text }}
              </span>
              <VSkeleton
                v-if="getInvestOneState.loading"
                height="18px"
                width="50px"
                class="investment-top-info__skeleton"
              />
              <button
                v-else-if="info.funding"
                type="button"
                class="investment-top-info__info-value is--small is--link-regular"
                @click.prevent="onFundingType"
              >
                {{ info.value }}
              </button>
              <span
                v-else
                class="investment-top-info__info-value is--small"
              >
                {{ info.value }}
              </span>
            </span>
            <template #content>
              {{ info.tooltip }}
            </template>
          </VTooltip>
        </InfoSlot>
      </div>
    </div>
    <VDialogContactUs
      v-model:open="isDialogContactUsOpen"
      :subject="'investment'"
    />
    <VDialogPortfolioTransaction
      v-if="getInvestOneData"
      v-model:open="isDialogTransactionOpen"
      :investment="getInvestOneData as any"
      :user-name="userName"
    />
    <VDialogPortfolioWire
      v-if="getInvestOneData"
      v-model:open="isDialogWireOpen"
      :investment="getInvestOneData as any"
      :user-name="userName"
    />
    <VDialogPortfolioCancelInvestment
      v-if="getInvestOneData"
      v-model:open="isDialogCancelOpen"
      :investment="getInvestOneData as any"
      @close="isDialogCancelOpen = false"
    />
  </div>
</template>

<style lang="scss">
.investment-top-info {
  $root: &;

  margin: 40px 0 45px;

  &__content {
    display: flex;
    gap: 20px;

    @media screen and (max-width: $desktop){
      flex-direction: column;
    }
  }

  &__button-wrap {
    margin-bottom: 12px;
  }

  &__img-wrap {
    width: 361px;
    height: 190px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;

    @media screen and (max-width: $desktop){
      width: 100%;
      height: 300px;
    }

    @media screen and (max-width: $tablet){
      width: 100%;
      height: 200px;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    max-width: 100%;
    object-fit: cover;

    &.is--default-image {
      max-width: 120px;
      max-height: 120px;
    }
  }

  &__left {
    position: relative;
  }

  &__right {
    width: 100%;
  }

  &__righ-top {
    width: 100%;
    display: flex;
    justify-content: space-between;

    @media screen and (max-width: $tablet-xs){
      flex-direction: column;
      gap: 8px;
    }
  }

  &__status {
    position: absolute;
    top: 12px;
    left: 12px;
  }

  &__id {
    color: $gray-80;
  }

  &__name {
    color: $black;
    margin-bottom: 4px;
  }

  &__offer-link-icon {
    width: 14px;
    height: 16px;
    color: $primary;
  }

  &__offer-link {
    cursor: pointer;
    margin-left: 10px;
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    align-items: end;
    flex-shrink: 0;

    @media screen and (max-width: $tablet-xs){
      flex-direction: row;
      gap: 8px;
      justify-content: space-between;
    }
  }

  &__investment {
    color: $black;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__shares {
    color: $gray-80;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 8px;

    span + span {
      border-left: 1px solid $gray-40;
      padding-left: 8px;
    }
  }

  &__info-wrap {
    margin-top: 27px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid $gray-20;
    color: $gray-80;
    width: 100%;

    @media screen and (max-width: $tablet){
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 10px;
    }

    @media screen and (max-width: $mobile-xs){
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  &__info-item {
    align-self: center;
    min-width: 218px;
    display: flex;
    gap: 12px;
    align-items: center;

    @media screen and (max-width: $desktop-lg){
      min-width: auto;
    }
  }

  &__info-text {
    color: $gray-70;
    min-width: 79px;
    text-align: initial;
  }

  &__back-icon {
    width: 20px;
  }
}
</style>
