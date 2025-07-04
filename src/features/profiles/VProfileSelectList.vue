<script setup lang="ts">
import { PropType } from 'vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useProfileSelectStore } from './store/useProfileSelect';
import { storeToRefs } from 'pinia';

defineProps({
  size: String as PropType<'large' | 'medium' | 'small'>,
  label: String,
});

const profileSelectStore = useProfileSelectStore();
const { userListFormatted, isLoading, defaultValue } = storeToRefs(profileSelectStore);

const onUpdate = (value: string) => {
  profileSelectStore.onUpdateSelectedProfile(value);
};
</script>

<template>
  <div class="VProfileSelectList v-profile-select-list">
    <VFormGroup
      :label="label"
    >
      <VFormSelect
        :model-value="defaultValue"
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
