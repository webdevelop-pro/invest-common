<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import arrowRight from 'UiKit/assets/images/arrow-right.svg?component';
import { useAccreditationButton } from './store/useAccreditationButton';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const accreditationButtonStore = useAccreditationButton();
const { data, tagBackground } = storeToRefs(accreditationButtonStore);

const onClick = () => {
  accreditationButtonStore.onClick();
};

defineProps({
  isLoading: Boolean,
});
</script>

<template>
  <VSkeleton
    v-if="isLoading"
    height="22px"
    width="100px"
    class="dashboard-top-info__skeleton"
  />
  <div
    v-else-if="data"
    class="VAccreditationButton v-accreditation-button"
    :class="data.class"
  >
    <VButton
      v-if="data.button"
      size="small"
      variant="link"
      color="red"
      class="v-accreditation-button__button"
      @click="onClick"
    >
      <span class="is--gt-tablet-show">
        {{ data.text }}
      </span>
      <span class="is--lt-tablet-show">
        {{ data.mobileText || data.text }}
      </span>
      <arrowRight
        alt="Arrow icon"
        class="v-accreditation-button__button-icon"
      />
    </VButton>

    <div
      v-else
      class="v-accreditation-button__tag-wrap"
    >
      <VTooltip
        :disabled="!Boolean(data.tooltip)"
      >
        <VBadge
          size="small"
          :color="tagBackground"
          class="v-accreditation-button__tag"
        >
          <span class="is--gt-tablet-show">
            {{ data.text }}
          </span>
          <span class="is--lt-tablet-show">
            {{ data.mobileText || data.text }}
          </span>
        </VBadge>
        <template #content>
          <div class="is--small">
            {{ data.tooltip }}
          </div>
        </template>
      </VTooltip>
    </div>
  </div>
</template>

<style lang="scss">
.v-accreditation-button {
  $root: &;

  &__tag-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__button-icon {
    width: 15px;
  }

  &__tag {
    display: block;
  }
}
</style>
