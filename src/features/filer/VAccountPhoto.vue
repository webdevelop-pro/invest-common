<script setup lang="ts">
import { PropType } from 'vue';
import VAvatar from 'UiKit/components/VAvatar.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import pen from 'UiKit/assets/images/pen.svg?component';
import { useAccountPhoto } from './logic/useAccountPhoto';

const props = defineProps({
  size: String as PropType<'large' | 'medium' | 'small'>,
  label: String,
  userId: {
    type: Number,
    required: true,
  },
  imageId: {
    type: Number,
    default: 0,
  },
  loading: Boolean,
});

const emit = defineEmits(['upload-id']);

const {
  FILER_URL,
  refFiles,
  filesUploadError,
  isLoading,
  onClick,
  onFileChange,
} = useAccountPhoto(props, emit);
</script>

<template>
  <div class="VAccountPhoto v-account-photo">
    <h2 class="is--h3__title">
      Account Photo
    </h2>
    <div class="v-account-photo__content is--margin-top-20">
      <VAvatar
        size="large"
        :src="(imageId > 0) ? `${FILER_URL}/auth/files/${imageId}?size=medium` : undefined"
        alt="avatar image"
        :loading="isLoading || loading"
        class="v-account-photo__avatar"
      />
      <div>
        <input
          id="file-control"
          ref="refFiles"
          name="file"
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          hidden
          @change="onFileChange"
        >
        <VButton
          size="small"
          :loading="isLoading"
          variant="outlined"
          class="v-account-photo__button"
          @click="onClick"
        >
          <pen
            class="v-account-photo__icon"
            alt="edit icon"
          />
          Edit Account Photo
        </VButton>
        <p class="is--small is--color-gray-70 is--margin-top-12">
          Supported files: jpg, jpeg, png. Maximum size 10 mb.
        </p>
        <p
          v-if="filesUploadError"
          class="is--small is--color-red"
        >
          {{ filesUploadError }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-account-photo {
  @media screen and (width < $tablet) {
      margin-top: 20px !important;
    }

  &__content {
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: center;

    @media screen and (max-width: $tablet-xs) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
