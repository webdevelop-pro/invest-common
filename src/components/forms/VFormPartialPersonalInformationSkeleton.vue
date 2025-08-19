<script setup lang="ts">
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

</script>

<template>
  <div class="VFormPartialPersonalInformationSkeleton v-form-partial-personal-information-skeleton">
    <div class="v-form-partial-personal-information-skeleton__subtitle is--h3__title">
      <VSkeleton
        height="36px"
        width="200px"
      />
    </div>
    <FormRow>
      <FormCol col3>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>

      <FormCol col3>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>

      <FormCol col3>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col-2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>

      <FormCol col-2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
    </FormRow>
    <div class="v-form-partial-personal-information-skeleton__subtitle is--h3__title">
      Residence Address
    </div>
    <FormRow>
      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>

      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>

      <FormCol col2>
        <VSkeleton
          height="28px"
          width="50px"
        />
        <VSkeleton
          size="large"
        />
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-personal-information-skeleton {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
