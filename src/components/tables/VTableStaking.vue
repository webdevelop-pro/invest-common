<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';

interface IActivityItem {
  icon: string,
    title: string,
    total: string,
    apy: string,
    stakedAmount: string,
    stakedCurrency: string,
    availableToStake: string,
    availableToClaim: string,
}

defineProps({
  data: Object as PropType<IActivityItem>,
  loading: Boolean,
});

const emit = defineEmits(['delete']);

const onDeleteSession = () => {
  emit('delete');
};
</script>

<template>
  <VTableRow
    class="VTableActivityItem v-table-activity-item"
  >
    <VTableCell class="v-table-activity-item__icon">
      <img
        :src="data?.icon"
        alt="icon"
      />
      <div class="v-table-activity-item__data">
        <span class=" v-table-activity-item__title">
          {{ data?.title }}</span>
        <span class="is--small">
          {{ data?.total }}</span>
      </div>
    </VTableCell>
    <VTableCell>
      <div class="v-table-activity-item__data">
        <span class=" v-table-activity-item__title">
          {{ data?.apy }}</span>
        <img
          :src="data?.icon"
          alt="icon"
        />
      </div>
    </VTableCell>
    <VTableCell>
      <div class="v-table-activity-item__data">
        <span class=" v-table-activity-item__title">
          {{ data?.stakedAmount }}</span>
        <span class="is--small">
          {{ data?.stakedCurrency }}</span>
      </div>
    </VTableCell>
    <VTableCell>
      <div class="v-table-activity-item__data">
        <span class=" v-table-activity-item__title">
          {{ data?.availableToStake }}</span>
        <img
          :src="data?.icon"
          alt="icon"
        />
      </div>
    </VTableCell>
    <VTableCell>
      <div class="v-table-activity-item__data">
        <span class=" v-table-activity-item__title">
          {{ data?.availableToClaim }}</span>
        <img
          :src="data?.icon"
          alt="icon"
        />
      </div>
    </VTableCell>
    <VTableCell>
      <VButton>Stake</VButton>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-activity-item {
  $root: &;

  &__data {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
    img {
      width: 20px;
      height: 20px;
    }

  &__icon {
    display: flex;
    align-items: center;
    gap: 8px;

    #{$root}__data {
      align-items: start;
    }
    img {
      width: 32px;
      height: 32px;
    }
  }

  &__title {

  }
}
</style>
