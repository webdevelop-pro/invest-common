<script setup lang="ts">
import { computed } from 'vue';
import VTableCell from 'UiKit/components/Base/VTable/VTableCell.vue';
import VTableRow from 'UiKit/components/Base/VTable/VTableRow.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
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

type BadgeColor = 'secondary' | 'default';

const badgeConfig = computed<{ color: BadgeColor; text: string }>(() => ({
  color: (props.data.stablecoin ? 'secondary' : 'default') as BadgeColor,
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
    <VTableCell
      v-highlight="search"
      class="is--h5__title"
    >
      {{ data.symbol }}
    </VTableCell>
    <VTableCell>
      {{ data.tvlFormatted }}
    </VTableCell>
    <VTableCell class="is--h5__title">
      {{ data.apyFormatted }}
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
    <VTableCell>
      <VBadge :color="badgeConfig.color">
        {{ badgeConfig.text }}
      </VBadge>
    </VTableCell>
    <VTableCell class="v-table-yield-item__actions">
      <VButton
        size="small"
        variant="link"
        @click="handleDetailsClick"
      >
        Details
      </VButton>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-yield-item {
  cursor: pointer !important;

  @media screen and (width < $desktop) {
    display: flex;
    flex-wrap: wrap;
  }

  &__actions {
    text-align: right;

    @media screen and (width < $desktop) {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 100%;
    }
  }

  .v-table-cell {
    @media screen and (width < $desktop) {
      display: flex;
      align-items: center;
      padding: 8px;
    }

    &:nth-child(1) {
      @media screen and (width < $desktop) {
        flex: 0 0 50%;
      }
    }

    &:nth-child(2) {
      @media screen and (width < $desktop) {
        flex: 0 0 50%;
        justify-content: flex-end;
      }
    }

    &:nth-child(3) {
      @media screen and (width < $desktop) {
        flex: 0 0 50%;
      }
    }

    &:nth-child(6) {
      @media screen and (width < $desktop) {
        flex: 0 0 50%;
        justify-content: flex-end;
      }
    }

    &:nth-child(7) {
      @media screen and (width < $desktop) {
        flex: 0 0 50%;
        justify-content: flex-end;
      }
    }
  }
}
</style>

