<script setup lang="ts">
import InfoSlot, { IInfoSlot } from 'InvestCommon/components/VInfoSlot/VInfoSlot.vue';
import { PropType } from 'vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import pen from 'InvestCommon/assets/images/icons/pen.svg?component';

export interface IReadOnlyForm {
  title: string;
  data?: IInfoSlot[];
}

defineProps({
  data: Object as PropType<IReadOnlyForm>,
  review: Boolean,
});

const emit = defineEmits(['edit']);

const onEditClick = () => {
  emit('edit');
};
</script>

<template>
  <div class="VReadOnlyForm v-read-only-form">
    <div class="v-read-only-form__header">
      <span class="v-read-only-form__title is--h3__title">
        {{ data?.title }}
      </span>
      <VButton
        v-if="review"
        size="small"
        variant="link"
        class="v-read-only-form__edit"
        @click="onEditClick"
      >
        Review
      </VButton>
      <VButton
        v-else
        size="small"
        variant="link"
        icon-placement="left"
        class="v-read-only-form__edit"
        @click="onEditClick"
      >
        <pen
          class="wd-modal-layout__edit-icon"
          alt="edit icon"
        />
        Edit
      </VButton>
    </div>
    <div class="v-read-only-form__content">
      <InfoSlot
        v-for="(item, index) in data?.data"
        :key="index"
        :title="item.title"
        :text="item.text"
      />
    </div>
  </div>
</template>

<style lang="scss">
.v-read-only-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  flex: 1 0 0;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    align-self: stretch;
  }

  &__title {
    flex: 1 0 0;
  }

  &__content {
    width: 100%;
  }
}
</style>
