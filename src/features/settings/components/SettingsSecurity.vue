<script setup lang="ts">
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableActivityItem from './VTableActivityItem.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import circleExclamation from 'UiKit/assets/images/circle-exclamation.svg';
import { useSettingsSecurity } from './logic/useSettingsSecurity';
import { defineAsyncComponent } from 'vue';

const VDialogContactUs = defineAsyncComponent({
  loader: () => import('InvestCommon/shared/components/dialogs/VDialogContactUs.vue'),
});

const {
  getAllSessionState,
  deleteOneSessionState,
  deleteAllSessionState,
  isDialogContactUsOpen,
  onDeleteId,
  activityHeader,
  activityBody,
  onFinishAllSessions,
  onDeleteSession,
  onContactUsClick,
} = useSettingsSecurity();

</script>

<template>
  <div class="SettingsSecurity settings-security">
    <h2>
      Account Security
    </h2>
    <div class="settings-security__header is--margin-top-40">
      <h3 class="settings-security__subtitle is--h3__title">
        Security logs
      </h3>
      <div class="settings-security__header-buttons">
        <VButton
          size="small"
          color="red"
          variant="link"
          class="settings-security__warning"
          @click="onContactUsClick"
        >
          <circleExclamation
            alt="Exclamation icon"
            class="settings-security__warning-icon"
          />
          Report Unknown Activity
        </VButton>
        <VButton
          size="small"
          color="red"
          variant="outlined"
          :disabled="activityBody.length === 1"
          :loading="deleteAllSessionState.loading"
          @click="onFinishAllSessions"
        >
          Finish All Active Sessions
        </VButton>
      </div>
    </div>

    <VTableDefault
      :loading-row-length="10"
      :header="activityHeader"
      :loading="getAllSessionState.loading"
      :data="activityBody"
      :colspan="4"
    >
      <VTableActivityItem
        v-for="(item, index) in activityBody"
        :key="index"
        :data="item"
        :colspan="activityHeader.length"
        :loading="deleteOneSessionState.loading && onDeleteId === item.id"
        @delete="onDeleteSession(item.id)"
      />
      <template #empty>
        You have no data
      </template>
    </VTableDefault>


    <VDialogContactUs
      v-model:open="isDialogContactUsOpen"
      :subject="'report an issue'"
    />
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.settings-security {

  &__header {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    margin-bottom: 16px;

    @media screen and (max-width: $tablet-xs) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  &__warning-icon {
    width: 16px;
    height: 16px;
  }

  &__header-buttons {
    display: flex;
    align-items: center;
    gap: 12px;

    @media screen and (max-width: $tablet-xs) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
