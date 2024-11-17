<script setup lang="ts">
import VTable from 'UiKit/components/VTable/VTable.vue';
import VTag from 'UiKit/components/VTag/VTag.vue';

const activityHeader = [
  'Date',
  'Action',
  'Location',
  'Device',
  'Browser',
];

const activityBody = [
  {
    date: '01/01/2024',
    status: 'Successful Login',
    ip: '213.246.200.170',
    device: 'Desktop',
    browser: 'Chrome, MacOs',
  },
  {
    date: '01/01/2024',
    status: 'Successful Login',
    ip: '213.246.200.170',
    device: 'Mobile',
    browser: 'Chrome, MacOs',
  },
  {
    date: '01/01/2024',
    status: 'Unsuccessful Login',
    ip: '213.246.200.170',
    device: 'Desktop',
    browser: 'Chrome, MacOs',
  },
  {
    date: '01/01/2024',
    status: 'Successful Login',
    ip: '213.246.200.170',
    device: 'Tablet',
    browser: 'Chrome, MacOs',
  },
  {
    date: '01/01/2024',
    status: 'Successful Login',
    ip: '213.246.200.170',
    device: 'Desktop',
    browser: 'Chrome, MacOs',
  },
];


const getTagBackground = (tag:string) => {
  if (tag === 'Unsuccessful Login') {
    return '#FFF1F1'; // red-light
  }
  return '#D9FFEE'; // secondary-light
};
</script>

<template>
  <VTable class="VTableActivity v-table-activity">
    <thead>
      <th
        v-for="headItem, headIndex in activityHeader"
        :key="headIndex"
      >
        {{ headItem }}
      </th>
    </thead>
    <tbody>
      <tr
        v-for="item, index in activityBody"
        :key="index"
      >
        <td class="is--date">
          {{ item.date }}
        </td>
        <td class="is--tag">
          <div class="v-table-activity__tag">
            <VTag
              :background="getTagBackground(item.status)"
              round
            >
              {{ item.status }}
            </VTag>
          </div>
        </td>
        <td class="is--ip">
          <a
            href="#"
            class="is--link-regular"
          >
            {{ item.ip }}
          </a>
        </td>
        <td class="is--device">
          {{ item.device }}
        </td>
        <td class="is--browser">
          {{ item.browser }}
        </td>
      </tr>
    </tbody>
  </VTable>
</template>

<style lang="scss">
.v-table-activity {
   &__tag {
     display: flex;
     margin: 8px 0 12px;
   }

   .is--date {
    width: 11.5%;
   }

   .is--tag {
    width: 22.5%;
   }

   .is--ip {
    width: 22%;
   }

   .is--device {
    width: 22%;
   }

   .is--desctop {
    width: 20%;
   }
}
</style>
