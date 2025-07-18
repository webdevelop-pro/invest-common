<script setup lang="ts">
import { computed, PropType, ref } from 'vue';
import { useFilerStore } from 'InvestCommon/store/useFiler';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { storeToRefs } from 'pinia';
import VAvatar from 'UiKit/components/VAvatar.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import pen from 'UiKit/assets/images/pen.svg?component';
import env from 'InvestCommon/global';

const { FILER_URL } = env;

defineProps({
  size: String as PropType<'large' | 'medium' | 'small'>,
  label: String,
});

const filerStore = useFilerStore();
const { postSignurlData } = storeToRefs(filerStore);
const userProfileStore = useUserProfilesStore();
const { getUserData } = storeToRefs(userProfileStore);

const refFiles = ref<HTMLInputElement>();
const filesUploadError = ref('');
const imageFile = ref<File>();
const isLoading = ref(false);

const onUpload = async (file: File) => {
  const res = await filerStore.uploadHandler(file, getUserData.value?.id, 'user');
  if (res) {
    const body = JSON.stringify({
      image_link_id: postSignurlData.value?.meta?.id,
    });
    await userProfileStore.updateUserData(getUserData.value?.id, body);
    userProfileStore.getUser();
  }
};

const onClick = () => {
  refFiles.value?.click();
};
const onFileChange = async () => {
  isLoading.value = true;
  const fileList = refFiles.value?.files as FileList;
  const incomingFiles = Array.from(fileList);
  const maxAllowedSize = 10 * 1024 * 1024; // 10MB
  filesUploadError.value = '';

  incomingFiles.forEach((file: File) => {
    if (file.size >= maxAllowedSize) {
      filesUploadError.value = 'Please upload a smaller file size. Limit 10MB';
    }
  });
  if (filesUploadError.value) return;
  [imageFile.value] = incomingFiles;
  await onUpload(imageFile.value);
  isLoading.value = false;
};

const imageID = computed(() => getUserData.value?.image_link_id);
</script>

<template>
  <div class="VAccountPhoto v-account-photo">
    <h2 class="is--h3__title">
      Account Photo
    </h2>
    <div class="v-account-photo__content is--margin-top-20">
      <VAvatar
        size="large"
        :src="imageID > 0 ? `${FILER_URL}/auth/files/${imageID}?size=medium` : undefined"
        alt="avatar image"
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
