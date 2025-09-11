<script setup lang="ts">
import VTableCell from 'UiKit/components/Base/VTable/VTableCell.vue';
import VTableRow from 'UiKit/components/Base/VTable/VTableRow.vue';
import { IFormPartialBeneficialOwnershipItemFormatted } from 'InvestCommon/data/profiles/profiles.types';

interface Props {
  data?: IFormPartialBeneficialOwnershipItemFormatted;
  loading?: boolean;
}

defineProps<Props>();

</script>

<template>
  <VTableRow class="VTableBeneficialItem v-table-beneficial-item">
    <VTableCell>
      <div>
        {{ data?.first_name || 'N/A' }}
      </div>
    </VTableCell>
    
    <VTableCell>
      <div>
        {{ data?.last_name || 'N/A' }}
      </div>
    </VTableCell>
    
    <VTableCell>
      <div>
        {{ data?.dob || 'N/A' }}
      </div>
    </VTableCell>
    
    <VTableCell>
      <div>
        {{ data?.phoneFormatted || 'N/A' }}
      </div>
    </VTableCell>
    
    <VTableCell>
      <div>
        {{ data?.email || 'N/A' }}
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
// Add any specific styling if needed
</style>
