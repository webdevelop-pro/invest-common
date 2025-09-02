<script setup lang="ts">
import { computed } from 'vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { useVFormFundsAdd } from './logic/useVFormFundsAdd';

const props = defineProps({
  data: Object,
});

const addressRef = computed<string | undefined>(() => props.data?.address);

const { qrCodeDataURL, isGeneratingQR, copied, onCopyClick } = useVFormFundsAdd(addressRef);
</script>

<template>
  <div class="VFormFundsAdd v-form-add-funds">
    <div class="v-form-add-funds__content  is--margin-top-20">
      <VSkeleton
        v-if="isGeneratingQR"
        height="200px"
        width="200px"
        class="v-form-add-funds__skeleton"
      />
      <VImage
        v-else-if="qrCodeDataURL"
        :src="qrCodeDataURL"
        alt="wallet qr code"
        class="v-form-add-funds__qr"
      />
      <div class="v-form-add-funds__right">
        <div class="v-form-add-funds__input-wrap">
          <VFormGroup
            label="Address"
            class="v-form-add-funds__input"
          >
            <VFormInput
              :model-value="props.data?.address"
              size="large"
              :loading="!props.data?.address"
              readonly
            />
          </VFormGroup>
          <VButton
            size="large"
            :uppercase="false"
            data-testid="button"
            class="v-form-add-funds__btn"
            @click="onCopyClick"
          >
            <span v-if="!copied">Copy</span>
            <span v-else>Copied!</span>
          </VButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.v-form-add-funds {
  &__qr {
    max-width: 200px;
    width: 100%;
    height: 100%;
    max-height: 200px;
  }

  &__right {
    width: 100%;
  }

  &__input {
    width: 100%;
  }

  &__input-wrap {
    width: 100%;
    display: flex;
    gap: 4px;
  }

  &__content {
    width: 100%;
    gap: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__btn {
    margin-top: 28px;
    min-width: 101px;
  }

  &__skeleton {
    flex-shrink: 0;
  }
}
</style>

