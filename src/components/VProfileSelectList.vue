<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
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
    const text = `${getId(item)}: ${getName(item)} Investment Profile`;
    userProfilesList.push({
      text: text.charAt(0).toUpperCase() + text.slice(1),
      id: `${item.id}`,
    });
  });
  userProfilesList.push({
    text: '+ Add A New Investment Account',
    id: 'new',
  });
  return userProfilesList;
});

const onUpdateSelectedProfile = (id: number | string) => {
  if (!id) return;
  if (id === 'new') {
    router.push({ name: ROUTE_CREATE_PROFILE });
  } else {
    userStore.setSelectedUserProfileById(id);
    // userProfilesStore.getProfileById(selectedUserProfileType.value, id);
    router.push({ name: router.currentRoute.value.name, params: { profileId: id } });
    // userProfilesStore.getProfileByIdOptions(selectedUserProfileType.value, selectedUserProfileId.value);
  }
};
</script>

<template>
  <div class="VProfileSelectList v-profile-select-list">
    <VFormSelect
      :model-value="`${selectedUserProfileId}`"
      name="investmentAccount"
      :size="size"
      data-testid="investAccount"
      item-label="text"
      item-value="id"
      :options="userListFormatted"
      :loading="userAccountLoading || (userListFormatted.length === 0)"
      @update:model-value="onUpdateSelectedProfile"
    />
  </div>
</template>

<style lang="scss">
.v-profile-select-list {
  width: 100%;

  .v-select-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
