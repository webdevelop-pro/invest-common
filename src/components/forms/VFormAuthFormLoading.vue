<script setup lang="ts">
import VSkeleton from 'UiKit/components/VSkeleton/VSkeleton.vue';
</script>

<template>
  <div class="VFormAuthFormLoading v-form-auth-loading is--no-margin">
    <VSkeleton
      v-for="item in 4"
      :key="item"
      height="300px"
      width="100%"
      class="v-form-auth-loading__skeleton"
    />
  </div>
</template>

<style lang="scss">
.v-form-auth-loading {
  max-height: 400px;
}
</style>
