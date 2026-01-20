<script setup lang="ts">
import { PropType, computed } from 'vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useProfileSelectStore } from './store/useProfileSelect';
import circleExclamation from 'UiKit/assets/images/circle-exclamation.svg';

const props = defineProps({
  size: String as PropType<'large' | 'medium'>,
  label: String,
  defaultValue: String,
  updateSelected: Boolean,
  loading: Boolean,
  hideDisabled: Boolean,
});

const emit = defineEmits<{
  (e: 'select', value: string): void;
}>();

const {
  userListFormatted, isLoading: loadingStore, defaultValue: storeDefaultValue, onUpdateSelectedProfile,
} = useProfileSelectStore({ hideDisabled: props.hideDisabled });

type ObjectOptionValue = string | number | boolean;
type ObjectOption = Record<string, ObjectOptionValue>;

const options = computed<ObjectOption[]>(() => userListFormatted.value as unknown as ObjectOption[]);

// Use prop defaultValue if provided, otherwise use store defaultValue
const selectedValue = computed(() => props.defaultValue || storeDefaultValue.value);

const onUpdate = (value: unknown) => {
  const stringValue = String(value ?? '');
  if (props.updateSelected) onUpdateSelectedProfile(stringValue);
  emit('select', stringValue);
};
</script>

<template>
  <div class="VProfileSelectList v-profile-select-list">
    <VFormGroup
      :label="label"
    >
      <VFormSelect
        :model-value="selectedValue"
        name="investmentAccount"
        :size="size"
        data-testid="investAccount"
        item-label="text"
        item-value="id"
        :options="options"
        :loading="loadingStore || loading"
        @update:model-value="onUpdate"
      >
        <template #item="slotProps">
          <div class="v-profile-select-list__option-wrap">
            <div
              class="v-profile-select-list__option"
              :class="{ 'is--disabled': (slotProps.item as any).disabled }"
            >
              <span class="v-profile-select-list__option-text">
                {{ (slotProps.item as any).text }}
              </span>
              <span
                v-if="(slotProps.item as any).kycStatusLabel"
                class="v-profile-select-list__option-status is--small"
                :class="(slotProps.item as any).kycStatusClass"
              >
                <span
                  class="v-profile-select-list__option-status-text v-profile-select-list__option-status-text--full"
                >
                  {{ (slotProps.item as any).kycStatusLabel }}
                </span>
                <span
                  class="v-profile-select-list__option-status-text v-profile-select-list__option-status-text--short"
                >
                  {{ (slotProps.item as any).kycStatusShortLabel || (slotProps.item as any).kycStatusLabel }}
                </span>
              </span>
            </div>
            <div
              v-if="(slotProps.item as any).disabledMessage?.length > 0"
              class="v-profile-select-list__option-message  is--color-red"
            >
              <circleExclamation
                alt="Exclamation icon"
                class="v-profile-select-list__option-icon"
              />
              <span class="is--small">
                {{ (slotProps.item as any).disabledMessage }}
              </span>
            </div>
          </div>
        </template>
      </VFormSelect>
    </VFormGroup>
  </div>
</template>

<style lang="scss">
.v-profile-select-list {
  width: 100%;

  .v-select-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    justify-content: space-between;

  }

  &__option-wrap {
    width: 100%;
    gap: 4px;
    display: flex;
    flex-direction: column;
  }

  &__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;

    &.is--disabled {
      opacity: 0.3;
    }
  }

  &__option-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &__option-message {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__option-status {
    text-align: right;
  }

  &__option-status-text--short {
    display: none;
  }

  @media screen and (width < $tablet) {
    &__option-status-text--full {
      display: none;
    }

    &__option-status-text--short {
      display: inline;
    }
  }
}
</style>
