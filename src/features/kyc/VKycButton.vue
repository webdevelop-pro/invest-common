<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import arrowRight from 'UiKit/assets/images/arrow-right.svg?component';
import { useKycButton } from './store/useKycButton';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const kycButtonStore = useKycButton();
const {
  data, tagBackground, isButtonLoading, isButtonDisabled, showContactUs,
  showSkeleton,
} = storeToRefs(kycButtonStore);

const handleClick = () => {
  kycButtonStore.onClick();
};

defineProps({
  isLoading: Boolean,
});
</script>

<template>
  <VSkeleton
    v-if="showSkeleton"
    height="22px"
    width="100px"
    class="dashboard-top-info__skeleton"
  />
  <div
    v-else-if="data"
    class="VKycButton v-kyc-button"
    :class="data.class"
  >
    <VButton
      v-if="data.button && !showContactUs"
      size="small"
      variant="link"
      color="red"
      :loading="isButtonLoading"
      :disabled="isButtonDisabled"
      class="v-kyc-button__button"
      @click="handleClick"
    >
      {{ data.text }}
      <arrowRight
        alt="Arrow icon"
        class="v-kyc-button__button-icon"
      />
    </VButton>

    <div
      v-else
      class="v-kyc-button__tag-wrap"
    >
      <VTooltip
        v-if="!showContactUs"
        :disabled="!Boolean(data.tooltip)"
      >
        <VBadge
          size="small"
          :color="tagBackground"
          class="v-kyc-button__tag"
        >
          {{ data.text }}
        </VBadge>
        <template #content>
          <div class="is--small">
            {{ data.tooltip }}
          </div>
        </template>
      </VTooltip>
      <a
        v-if="showContactUs"
        :href="data.contactUsUrl"
        class="is--link-2"
      >
        Contact Us
      </a>
    </div>
  </div>
</template>

<style lang="scss">
.v-kyc-button {
  $root: &;

  &__tag-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 12px;
  }

  &__button-icon {
    width: 15px;
  }

  &__tag {
    display: block;
  }
}
</style>
