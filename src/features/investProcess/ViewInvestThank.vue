<script setup lang="ts">
import { useInvestThank } from './logic/useInvestThank';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import InfoSlot from 'UiKit/components/VInfo/VInfoSlot.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';

const {
  loading,
  data,
  trackInvestmentTo,
  getInvestOneState,
  selectedUserProfileId,
  ROUTE_DASHBOARD_PORTFOLIO,
} = useInvestThank();
</script>

<template>
  <div class="ViewInvestThank view-invest-thank is--no-margin">
    <div class="wd-container">
      <div
        v-if="getInvestOneState.data"
        class="view-invest-thank__container"
      >
        <div class="view-invest-thank__title-wrap">
          <h1 class="view-invest-thank__title is--display-2">
            Thank you for your investment! 🎉
          </h1>
          <p
            class="view-invest-thank__description is--subheading-2"
          >
            We are happy to announce that you successfully invested in
            <VSkeleton
              v-if="loading"
              height="28px"
              width="102px"
              class="view-invest-thank__skeleton"
            />
            <span
              v-else
              class="is--h4__title"
            >
              {{ getInvestOneState.data.offer.name }}
            </span>
            and your investment is currently at the confirmed status. Get more details in
            <VSkeleton
              v-if="loading"
              height="28px"
              width="102px"
              class="view-invest-thank__skeleton"
            />
            <router-link
              v-else
              :to="{ name: ROUTE_DASHBOARD_PORTFOLIO, params: { profileId: selectedUserProfileId } }"
              class="is--link-1"
            >
              Portfolio.
            </router-link>
          </p>
        </div>
        <div class="view-invest-thank__invest-wrap is--card">
          <div class="view-invest-thank__invest-id is--h5__title">
            ID 

            <VSkeleton
              v-if="loading"
              height="28px"
              width="50px"
              class="view-invest-thank__skeleton"
            />
            <span v-else>
              {{ getInvestOneState.data.id }}
            </span>
          </div>

          <InfoSlot class="view-invest-thank__info">
            <div class="view-invest-thank__table-offer">
              <div class="view-invest-thank__table-offer-wrap">
                <div class="view-invest-thank__table-image-wrap">
                  <VImage
                    :src="getInvestOneState.data.offer.imageSmall"
                    :alt="`${getInvestOneState.data.offer.name} image`"
                    fit="cover"
                    :is-loading="loading"
                    class="view-invest-thank__table-image"
                    :class="{ 'is--default-image': getInvestOneState.data.offer.isDefaultImage }"
                  />
                </div>
                <div>
                  <VSkeleton
                    v-if="loading"
                    height="26px"
                    width="100px"
                  />
                  <div v-else>
                    {{ getInvestOneState.data.offer.name }}
                  </div>
                  <VSkeleton
                    v-if="loading"
                    height="18px"
                    width="100px"
                  />
                  <div
                    v-else
                    class="view-invest-thank__table-funded is--small"
                  >
                    {{ getInvestOneState.data.offer.offerFundedPercent }}% funded
                  </div>
                </div>
              </div>
              <VSkeleton
                v-if="loading"
                height="34px"
                width="100px"
                border-radius="24px"
                class="view-invest-thank__table-tag"
              />
              <VBadge
                v-else
                :color="getInvestOneState.data.statusFormatted.color"
                class="view-invest-thank__table-tag"
              >
                {{ getInvestOneState.data.statusFormatted.text }}
              </VBadge>
            </div>
          </InfoSlot>
          <InfoSlot class="view-invest-thank__info">
            <div
              v-for="(item, index) in data"
              :key="index"
              :title="item.title"
              :text="item.text"
              class="view-invest-thank__description-item"
            >
              <span class="view-invest-thank__description-title is--h6__title">
                {{ item.title }}
              </span>
              <VSkeleton
                v-if="loading"
                height="24px"
                width="100px"
                class="view-invest-thank__skeleton"
              />
              <span
                v-else
                class="view-invest-thank__description-value"
                :class="item.isBold ? 'is--h5__title' : 'is--body'"
              >
                {{ item.text }}
              </span>
            </div>
          </InfoSlot>

          <VButton
            size="large"
            block
            as="router-link"
            class="view-invest-thank__invest-button"
            :to="trackInvestmentTo"
          >
            Track Investment
          </VButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.view-invest-thank {
  width: 100%;
  padding-top: 105px;
  padding-bottom: 80px;

  @include media-lte(tablet) {
    padding-bottom: 60px;
  }

  &__description {
    color: $gray-80;
  }

  &__title-wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  &__container {
    display: flex;
    padding: 0 0 50px;
    align-items: flex-start;
    gap: 80px;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      gap: 40px;
    }
  }

  &__invest-wrap {
    display: flex;
    width: 43%;
    padding: 40px;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    flex-shrink: 0;

    @media screen and (max-width: $tablet){
      width: 100%;
      padding: 20px;
    }
  }

  &__invest-id {
    color: $primary;
    margin-bottom: 28px;

    @media screen and (max-width: $tablet){
      margin-bottom: 8px;
    }
  }

  &__invest-button {
    margin-top: 28px;
  }

  &__table-offer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    @media screen and (max-width: $tablet){
      // flex-direction: column;
      gap: 16px;
      flex-flow: column wrap;
      align-items: flex-start;
    }
  }

  &__table-offer-wrap {
    flex: 1 0 0;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__table-image {
    width: 55px;
    height: 55px;
    object-fit: cover;

    &.is--default-image {
      max-width: 35px;
      max-height: 35px;
    }
  }

  &__table-image-wrap {
    min-width: 55px;
    min-height: 55px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__info {
    border-top: 1px solid $gray-20;

    @media screen and (max-width: $tablet){
      padding: 16px 0;
      flex-wrap: wrap;
    }
  }

  &__description-title {
    color: $gray-70;

    @media screen and (max-width: $tablet){
      padding-right: 8px;
    }
  }

  &__description-value {
    color: $gray-80;
  }

  &__description-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media screen and (max-width: $tablet){
      flex-wrap: wrap;
    }
  }

  &__skeleton {
    display: inline-block;
    vertical-align: middle;
  }
}

</style>
