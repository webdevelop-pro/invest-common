<script setup lang="ts">
defineProps({
  title: String,
  subTitle: String,
  text: String,
});
</script>

<template>
  <div class="DashboardTabsTopInfo dashboard-tab-top-info">
    <div
      v-if="title"
      class="dashboard-tab-top-info__title is--h2__title"
    >
      {{ title }}
    </div>
    <div
      v-if="text || $slots.text"
      class="dashboard-tab-top-info__text is--small"
    >
      <slot name="text">
        <p v-dompurify-html="text" />
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-tab-top-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
  margin-bottom: 40px;
  

  @media screen and (width < $tablet){
        margin-bottom: 20px;
  }

  &__text {
    color: $gray-80;
  }
}
</style>
