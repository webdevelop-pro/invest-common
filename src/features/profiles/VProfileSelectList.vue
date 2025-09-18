<script setup lang="ts">
import { PropType, computed } from 'vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useProfileSelectStore } from './store/useProfileSelect';

const props = defineProps({
  size: String as PropType<'large' | 'medium' | 'small'>,
  label: String,
  defaultValue: String,
});

const {
  userListFormatted, isLoading, defaultValue: storeDefaultValue, onUpdateSelectedProfile,
} = useProfileSelectStore();

// Use prop defaultValue if provided, otherwise use store defaultValue
const selectedValue = computed(() => props.defaultValue || storeDefaultValue.value);

const onUpdate = (value: string) => {
  onUpdateSelectedProfile(value);
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
        :options="userListFormatted"
        :loading="isLoading"
        @update:model-value="onUpdate"
      />
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
  }
}
</style>
