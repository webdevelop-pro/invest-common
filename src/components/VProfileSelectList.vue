<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useUserProfilesStore, useUsersStore } from 'InvestCommon/store';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_CREATE_PROFILE } from 'InvestCommon/helpers/enums/routes';
import { IProfileIndividual } from 'InvestCommon/types/api/user';

defineProps({
  size: String as PropType<'large' | 'medium' | 'small'>,
});

const router = useRouter();
const userStore = useUsersStore();
const {
  userAccountLoading, selectedUserProfileId,
  userProfiles, selectedUserProfileType,
} = storeToRefs(userStore);
const userProfilesStore = useUserProfilesStore();
//
interface ISelectedProfile {
  text: string;
  id: number | string;
}

const getId = (profile: IProfileIndividual) => {
  const type = profile.type?.slice(0, 2).toUpperCase();
  return `${type}${profile.id}`;
};

const getName = (profile: IProfileIndividual) => {
  if (profile.type === 'entity') {
    return profile.data?.name;
  }
  return profile.type;
};
const userListFormatted = computed(() => {
  const userProfilesList: ISelectedProfile[] = [];
  userProfiles.value.forEach((item: IProfileIndividual) => {
    const text = `${getName(item)} Investment Profile: ${getId(item)}`;
    userProfilesList.push({
      text: text.charAt(0).toUpperCase() + text.slice(1),
      id: item.id,
    });
  });
  userProfilesList.push({
    text: '+ Add A New Investment Account',
    id: 'new',
  });
  return userProfilesList;
});
const selectedUserProfileFormatted = computed(() => (
  userListFormatted.value.filter((item) => item.id === selectedUserProfileId.value)));

const onUpdateSelectedProfile = (id: number | string) => {
  if (!id) return;
  if (id === 'new') {
    void router.push({ name: ROUTE_CREATE_PROFILE });
  } else {
    userStore.setSelectedUserProfileById(id);
    void userProfilesStore.getProfileById(selectedUserProfileType.value, id);
    void router.push({ name: router.currentRoute.value.name, params: { profileId: id } });
    void userProfilesStore.getProfileByIdOptions(selectedUserProfileType.value, selectedUserProfileId.value);
  }
};
</script>

<template>
  <div class="VProfileSelectList v-profile-select-list">
    <VSkeleton
      v-if="userAccountLoading"
      height="30px"
      width="250px"
      style="margin-bottom: 67px;"
      class="v-profile-select-list__skeleton"
    />
    <VFormSelect
      v-else
      :model-value="selectedUserProfileFormatted"
      name="investmentAccount"
      :size="size"
      dropdown-absolute
      data-testid="investAccount"
      item-label="text"
      item-value="id"
      :options="userListFormatted"
      @update:model-value="onUpdateSelectedProfile"
    />
  </div>
</template>

<style lang="scss">
.v-profile-select-list {
  width: 100%;
}
</style>
