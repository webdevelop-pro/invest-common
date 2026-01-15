<script setup lang="ts">
import VTableCell from 'UiKit/components/Base/VTable/VTableCell.vue';
import VTableRow from 'UiKit/components/Base/VTable/VTableRow.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';

interface Props {
  data: DefiLlamaYieldPoolFormatted;
  search?: string;
  size?: 'large' | 'regular' | 'small';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'row-click', pool: DefiLlamaYieldPoolFormatted): void;
}>();

const onRowClick = () => {
  emit('row-click', props.data);
};

const onDetailsClick = (event: Event) => {
  event.stopPropagation();
  emit('row-click', props.data);
};
</script>

<template>
  <VTableRow
    class="v-table-yield-item"
    @click="onRowClick"
  >
    <VTableCell
      :key="props.data.symbol"
      v-highlight="props.search"
      class="is--h5__title"
    >
      {{ props.data.symbol }}
    </VTableCell>
    <VTableCell>
      {{ props.data.tvlFormatted }}
    </VTableCell>
    <VTableCell class="is--h5__title">
      {{ props.data.apyFormatted }}
    </VTableCell>
    <VTableCell>
      {{ props.data.apyBaseFormatted }}
    </VTableCell>
    <VTableCell>
      {{ props.data.apyRewardFormatted }}
    </VTableCell>
    <VTableCell>
      {{ props.data.apyMean30dFormatted }}
    </VTableCell>
    <VTableCell>
      <VBadge
        :color="props.data.stablecoin ? 'secondary' : 'default'"
      >
        {{ props.data.stablecoin ? 'Stablecoin' : 'Volatile' }}
      </VBadge>
    </VTableCell>
    <VTableCell class="v-table-yield-item__actions">
      <VButton
        size="small"
        variant="link"
        @click="onDetailsClick"
      >
        Details
      </VButton>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-yield-item {
  cursor: pointer !important;

  &__actions {
    text-align: right;
  }
}
</style>

