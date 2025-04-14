<script setup lang="ts">
import { PropType, ref, watch } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { jsPDF } from 'jspdf';
import { currency } from 'InvestCommon/helpers/currency';
import { IInvest } from 'InvestCommon/types/api/invest';
import download from 'UiKit/assets/images/download.svg';
import {
  VDialogContent, VDialogFooter, VDialogHeader, VDialogTitle, VDialog,
} from 'UiKit/components/Base/VDialog';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { storeToRefs } from 'pinia';

const useDialogsStore = useDialogs();
const { isDialogTransactionOpen } = storeToRefs(useDialogsStore);

const props = defineProps({
  investment: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  userName: String,
});
const open = defineModel<boolean>();

const DownloadComp = ref<HTMLElement | null>(null);

const saveHandler = () => {
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF();

  pdf.html(DownloadComp.value, {
    callback(doc) {
      // Save the PDF
      doc.save(`WireInformation${props.investment.id}.pdf`);
    },
    margin: [10, 10, 10, 10],
    autoPaging: 'text',
    html2canvas: {
      useCORS: true,
      allowTaint: true,
      logging: false,
    },
    x: 0,
    y: 0,
    width: 190, // target width in the PDF document
    windowWidth: 690, // window width in CSS pixels
  });
};

watch(() => open.value, () => {
  if (!open.value) {
    isDialogTransactionOpen.value = false;
  }
});
</script>

<template>
  <VDialog v-model:open="open">
    <VDialogContent
      :aria-describedby="undefined"
      class="wd-modal-portfolio-wire"
    >
      <div>
        <VDialogHeader>
          <VDialogTitle class="wd-modal-portfolio-wire__title ">
            Wire Instructions
          </VDialogTitle>
        </VDialogHeader>
        <div
          id="download-content"
          ref="DownloadComp"
          class="wd-modal-portfolio-wire__text"
        >
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Investment ID:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.id }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Amount:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ currency(investment.amount) }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Offer Legal Name:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.offer.legal_name }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Offer Name:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.offer.name }}
            </span>
          </div>
          <hr class="wd-modal-portfolio-wire__divider" />
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Wire to:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.offer.data?.wire_to }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Routing Number:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.offer.data?.routing_number }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Account Number:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.offer.data?.account_number }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              Custodian / Account Name:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.offer.data?.custodian }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              FFCT:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              Offer {{ investment.offer.id }}, {{ userName }}
            </span>
          </div>
          <div class="wd-modal-portfolio-wire__row">
            <span class="wd-modal-portfolio-wire__text-title is--h6__title">
              SWIFT ID:
            </span>
            <span class="wd-modal-portfolio-wire__text-value">
              {{ investment.offer.data?.swift_id }}
            </span>
          </div>
        </div>
      </div>
      <VDialogFooter>
        <div class="wd-modal-portfolio-wire__footer-btns">
          <VButton
            variant="outlined"
            data-testid="cancel-button"
            @click="open = false"
          >
            Cancel
          </VButton>
          <VButton
            icon-placement="left"
            @click="saveHandler"
          >
            <download
              alt="download icon"
              class="wd-modal-portfolio-wire__save-icon"
            />
            Save as PDF
          </VButton>
        </div>
      </VDialogFooter>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
@use 'UiKit/styles/_colors.scss' as *;
.wd-modal-portfolio-wire {
    @media screen and (max-width: $tablet){
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

  &__title {
    margin-bottom: 11px;
  }

  &__text {
    color: $gray-80;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
  }

  &__row {
    display: flex;
    gap: 12px;
    max-width: 475px;
    @media screen and (max-width: $tablet){
      flex-wrap: wrap;
      width: 100%;
      max-width: 100%;
    }
  }

  &__text-title {
    color: $gray-70;
    min-width: 181px;
  }

  &__footer-btns {
    display: flex;
    padding-top: 30px;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    @media screen and (max-width: $tablet){
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__divider {
    width: 100%;
    height: 1px;
    background-color: $gray-20;
    border: none;
  }

  &__text-value {
    word-spacing: 8px;
  }

  &__save-icon {
    width: 20px;
  }
}
</style>
