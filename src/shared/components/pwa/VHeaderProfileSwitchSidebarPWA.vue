<script setup lang="ts">
import {
  VSheet,
  VSheetContent,
  VSheetHeader,
  VSheetTitle,
} from 'UiKit/components/Base/VSheet';
import ProfileSwitchMenuList from 'InvestCommon/features/profiles/components/ProfileSwitchMenuList.vue';

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (e: 'select', value: string): void;
}>();
</script>

<template>
  <VSheet
    v-model:open="open"
    class="VHeaderProfileSwitchSidebarPWA v-header-profile-switch-sidebar-pwa"
  >
    <VSheetContent
      :aria-describedby="undefined"
      class="v-header-profile-switch-sidebar-pwa__content"
    >
      <VSheetHeader class="v-header-profile-switch-sidebar-pwa__header">
        <VSheetTitle>
          Switch profile
        </VSheetTitle>
      </VSheetHeader>
      <div class="v-header-profile-switch-sidebar-pwa__body">
        <ProfileSwitchMenuList
          variant="overlay"
          @select="emit('select', $event)"
        />
      </div>
    </VSheetContent>
  </VSheet>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-header-profile-switch-sidebar-pwa {
  &__header {
    box-shadow: $box-shadow-small;
    color: $black;
  }

  &__content {
    max-width: 420px !important;
    z-index: 101;
  }

  &__body {
    padding: 20px 12px;
    max-height: calc(100vh - 65px);
    overflow-y: auto;
  }
}
</style>
