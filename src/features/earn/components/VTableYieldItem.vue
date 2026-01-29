<script setup lang="ts">
import { computed } from 'vue';
import VTableCell from 'UiKit/components/Base/VTable/VTableCell.vue';
import VTableRow from 'UiKit/components/Base/VTable/VTableRow.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';

interface Props {
  data: DefiLlamaYieldPoolFormatted;
  search?: string;
}

const props = withDefaults(defineProps<Props>(), {
  search: '',
});

const emit = defineEmits<{
  (e: 'row-click', pool: DefiLlamaYieldPoolFormatted): void;
}>();

type BadgeColor = 'secondary-light' | 'default';

const badgeConfig = computed<{ color: BadgeColor; text: string }>(() => ({
  color: (props.data.stablecoin ? 'secondary-light' : 'default') as BadgeColor,
  text: props.data.stablecoin ? 'Stablecoin' : 'Volatile',
}));

const handleRowClick = () => {
  emit('row-click', props.data);
};

const handleDetailsClick = (event: Event) => {
  event.stopPropagation();
  emit('row-click', props.data);
};
</script>

<template>
  <VTableRow
    class="v-table-yield-item"
    tabindex="0"
    @click="handleRowClick"
    @keydown.enter="handleRowClick"
    @keydown.space.prevent="handleRowClick"
  >
    <VTableCell>
      <span
        v-highlight="search"
        class="is--h5__title"
      >
        {{ data.symbol }}
      </span>
    </VTableCell>
    <VTableCell>
      {{ data.tvlFormatted }}
    </VTableCell>
    <VTableCell>
      <span class="is--h5__title">
        {{ data.apyFormatted }}
      </span>
    </VTableCell>
    <VTableCell class="is--gt-desktop-show">
      {{ data.apyBaseFormatted }}
    </VTableCell>
    <VTableCell class="is--gt-desktop-show">
      {{ data.apyRewardFormatted }}
    </VTableCell>
    <VTableCell class="is--gt-desktop-show">
      {{ data.apyMean30dFormatted }}
    </VTableCell>
    <VTableCell class="is--gt-desktop-show">
      <VBadge :color="badgeConfig.color">
        {{ badgeConfig.text }}
      </VBadge>
    </VTableCell>
    <VTableCell class="v-table-yield-item__actions is--gt-desktop-show">
      <a
        href="#"
        class="is--link-2"
        @click.prevent="handleDetailsClick"
      >
        Supply
      </a>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-yield-item {
  cursor: pointer !important;

  &__actions {
    text-align: right;


  }
}
</style>

