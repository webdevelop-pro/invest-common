<script setup lang="ts">
import { PropType, ref } from 'vue';
import VModalLayout from 'UiKit/components/VModal/VModalLayout.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { jsPDF } from 'jspdf';
import { currency } from 'InvestCommon/helpers/currency';
import { IInvest } from 'InvestCommon/types/api/invest';
import download from 'UiKit/assets/images/download.svg';

const props = defineProps({
  investment: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  userName: String,
});
defineEmits(['close']);

const DownloadComp = ref<HTMLElement | null>(null);

const saveHandler = () => {
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF();
  // eslint-disable-next-line
  void pdf.html(DownloadComp.value, {
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
</script>

<template>
  <VModalLayout
    class="wd-modal-portfolio-wire is--no-margin"
    @close="$emit('close')"
  >
    <template #default>
      <div
        id="download-content"
        ref="DownloadComp"
        class="wd-modal-portfolio-wire__text"
      >
        <div class="wd-modal-portfolio-wire__title is--h3__title">
          Wire Instructions
        </div>
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
    </template>

    <template #footer>
      <div class="wd-modal-portfolio-wire__footer-btns">
        <VButton
          variant="outlined"
          data-testid="cancel-button"
          @click="$emit('close')"
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
    </template>
  </VModalLayout>
</template>

<style lang="scss">
.wd-modal-portfolio-wire {
  width: 700px !important;

  &__title {
    margin-top: 32px;
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
    margin-left: 12px;
  }

  &__row {
    display: flex;
    gap: 12px;
    max-width: 475px;
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
