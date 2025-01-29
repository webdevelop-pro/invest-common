<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHelloSign } from 'InvestCommon/composable/useHelloSign';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import {
  ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP,
} from 'InvestCommon/helpers/enums/routes';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { ISignature } from 'InvestCommon/types/api/invest';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import { storeToRefs } from 'pinia';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg?component';
import file from 'UiKit/assets/images/file.svg';
import { urlTerms, urlPrivacy, urlOfferSingle } from 'InvestCommon/global/links';

const { submitFormToHubspot } = useHubspotForm('745431ff-2fed-4567-91d7-54e1c3385844');
const offerStore = useOfferStore();
const { getUnconfirmedOfferData } = storeToRefs(offerStore);
const usersStore = useUsersStore();
const { userAccountData } = storeToRefs(usersStore);
const {
  onClose, onSign, openHelloSign, closeHelloSign,
} = useHelloSign();
const useDialogsStore = useDialogs();
const router = useRouter();
const route = useRoute();
const checkbox1 = ref(false);
const checkbox2 = ref(false);
const slug = route?.params.slug as string;
const id = route?.params.id as string;
const profileId = route?.params.profileId as string;
const signId = ref(getUnconfirmedOfferData.value?.signature_data.signature_id);

const investmentsStore = useInvestmentsStore();
const {
  setSignatureData, isSetSignatureLoading, setDocumentData, isSetDocumentLoading,
  getDocumentData, isGetDocumentLoading,
} = storeToRefs(investmentsStore);

onSign(async (data: ISignature) => {
  if (data.signatureId) {
    await investmentsStore.setSignature(slug, id, profileId, data.signatureId);
  }
  if (setSignatureData.value) {
    signId.value = data.signatureId;
  }
});

const continueHandler = () => {
  void router.push({
    name: ROUTE_INVEST_FUNDING,
  });

  void submitFormToHubspot({
    email: userAccountData.value?.email,
    invest_checkbox_1: checkbox1.value,
    invest_checkbox_2: checkbox2.value,
    sign_id: signId.value,
  });
};

const documentHandler = async () => {
  if (signId.value) {
    await investmentsStore.getDocument(id);
    window.open(getDocumentData.value, '_blank');
    return;
  }

  await investmentsStore.setDocument(slug, id, profileId);

  if (setDocumentData.value && setDocumentData.value.sign_url) {
    void useDialogsStore.showDocument(setDocumentData.value.sign_url, openHelloSign, closeHelloSign);
    onClose(() => void useDialogsStore.hideDocument());
  }
};
</script>

<template>
  <div class="FormInvestSignature form-invest-signature">
    <div class="form-invest-signature__label is--h6__title">
      Review and sign the agreement:
    </div>
    <div
      class="form-invest-signature__document"
      @click="documentHandler"
    >
      <VButton
        size="large"
        variant="link"
        color="secondary"
        :loading="isSetDocumentLoading || isSetSignatureLoading || isGetDocumentLoading"
        :disabled="isSetDocumentLoading || isSetSignatureLoading || isGetDocumentLoading"
        class="form-invest-signature__document-button"
      >
        <file
          alt="file icon"
          class="form-invest-signature__document-icon"
        />
        Investment Agreement
      </VButton>

      <VBadge
        size="medium"
        :color="signId ? 'secondary-light' : null"
        class="form-invest-signature__tag"
        data-testid="document-sign"
        :class="{ 'is-signed': signId }"
      >
        {{ signId ? 'Signed' : 'Signature Needed' }}
      </VBadge>
    </div>
    <div
      class="form-invest-signature__checkbox-wrap"
    >
      <VFormCheckbox
        v-model="checkbox1"
        data-testid="V-checkbox"
        class="form-invest-signature__checkbox"
      >
        I have reviewed and agree to the terms of the offering document
        and I agree to complete the investment process using HelloSign.
      </VFormCheckbox>
      <VFormCheckbox
        v-model="checkbox2"
        data-testid="V-checkbox"
        class="form-invest-signature__checkbox"
      >
        I have reviewed and agree to the
        <a
          :href="urlTerms"
          target="_blank"
          rel="noopener noreferrer"
          class="form-invest-signature__link is--link-1"
        >
          Terms of use
        </a> and the
        <a
          :href="urlPrivacy"
          target="_blank"
          rel="noopener noreferrer"
          class="form-invest-signature__link is--link-1"
        >
          Privacy Policy
        </a>.
      </VFormCheckbox>
    </div>
    <div class="form-invest-signature__footer">
      <VButton
        variant="link"
        size="large"
        as="router-link"
        :to="{ name: ROUTE_INVEST_OWNERSHIP, params: { slug, id, profileId } }"
      >
        <arrowLeft
          alt="arrow left"
          class="form-invest-signature__back-icon"
        />
        Back
      </VButton>
      <div class="form-invest-signature__btn">
        <VButton
          variant="outlined"
          size="large"
          as="a"
          :href="urlOfferSingle(route.params.slug)"
        >
          Cancel
        </VButton>
        <VButton
          :disabled="!checkbox1 || !checkbox2 || !signId"
          size="large"
          data-testid="continue-button"
          @click="continueHandler"
        >
          Continue
        </VButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.form-invest-signature {
  $root: &;

  &__label {
    color: $gray-80;
  }

  &__document {
    margin-bottom: 35px;
    display: flex;
    justify-content: space-between;
    padding: 16px;
    gap: 8px;
    border-top: 1px solid $gray-20;
    border-bottom: 1px solid $gray-20;
    margin-top: 8px;
    cursor: pointer;
    transition: all 0.3s ease;;
    align-items: center;

    &:hover {
      background-color: $gray-10;
    }

    @media screen and (max-width: $tablet){
      flex-direction: column;
      padding: 16px 0;
      gap: 10px;
    }
  }

  &__checkbox {
    margin-bottom: 25px;
    padding: 0 16px;
    &:last-child {
      margin-bottom: 0;
    }
    @media screen and (max-width: $tablet){
      padding: 0;
    }
  }

  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__footer {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;


    @media screen and (max-width: $tablet){
      flex-direction: column;
      gap: 12px;
    }
  }

  &__document-icon {
    width: 19px;
    flex-shrink: 0;
  }

  &__back-icon {
    width: 20px;
  }

  &__link {
    margin-top: -2px;
    display: inline-block;
  }
}
</style>
