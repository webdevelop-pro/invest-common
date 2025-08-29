<script setup lang="ts">
</script>

<template>
  <div class="VFooterText v-footer-text">
    <div class="is--container">
      <p class="is--small">
        Securities through Invest PRO Member: FINRA/SIPC. Only available in states
        where Invest PRO is registered. For more information on Invest PRO,
        please visit FINRA’s BrokerCheck or download a copy of our Customer
        Relationship Summary. You may also contact us at +1 609 733 7724.
      </p>
      <p class="is--small">
        Listings on this portal:
      </p>
      <ul class="is--small v-footer-text__list">
        <li>
          do not constitute an offer of securities
          or a solicitation of an offer to buy securities
        </li>
        <li>
          offers can be made only by the confidential Private Placement Memorandum
          (the “PPM”) which is available for download via each listing’s dedicated page
        </li>
        <li>do not and cannot replace the PPM and is qualified in its entirety by the PPM, and</li>
        <li>
          may not be relied upon in making an investment decision related to any
          investment offering by the issuer, or any affiliate, or partner thereof (&quot;Issuer&quot;).
        </li>
      </ul>
      <p class="is--small">
        - Investment decisions may only be made on the basis of a confidential PPM prepared by the
        respective Issuer. All potential investors must read the PPM and no person may invest without
        acknowledging receipt and complete review of the PPM.<br>
        - With respect to any stated objectives outlined within the PPM or other materials for the listing,
        these do not constitute a promise of performance, nor is there any assurance that the
        investment objectives of any program will be attained.<br>
        - All stated objectives are based upon reasonable assumptions more fully outlined in the PPM for
        the respective offering. Consult the PPM for investment conditions, risk factors, minimum
        requirements, fees and expenses and other pertinent information with respect to any
        investment.<br>
        - These investment opportunities have not been registered under the Securities Act of 1933 and
        are being sold pursuant to an exemption therefrom and from applicable state securities laws,
        and they are considered high risk, illiquid investments.<br>
        Past performance is no guarantee of future results. All investments carry the risk of loss of some
        or all of the principal invested.<br>
        - You should always consult a tax professional prior to investing.<br>
        - All information is subject to change. While each Issuer strives to keep information on this
        platform up to date as promptly as possible, nether Invest PRO nor the Issuers
        warrant the accuracy or completeness of information contained within each listing.<br>
        - Invest PRO is not affiliated with the listings on this platform unless specifically
        provided for on the listing page.<br>
      </p>
    </div>
  </div>
</template>

<style lang="scss">
.v-footer-text {
  $root: &;

  color: $gray-50;
  background-color: $black;

  &__list {
    list-style-type: disc;
    list-style-position: inside;
    margin: 16px 3px;
  }

  p, li, ul {
    color: inherit;
  }

  li + li {
    margin-top: 0;
  }

  ul {
    padding-left: 0;
  }
}
</style>
