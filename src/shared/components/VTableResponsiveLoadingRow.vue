<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';

type LoadingVariant =
  | 'default'
  | 'portfolio'
  | 'distribution'
  | 'wallet-token'
  | 'wallet-transaction'
  | 'yield'
  | 'document'
  | 'activity'
  | 'beneficial';

withDefaults(defineProps<{
  columns?: number;
  variant?: LoadingVariant;
}>(), {
  columns: 1,
  variant: 'default',
});
</script>

<template>
  <VTableRow class="VTableResponsiveLoadingRow v-table-responsive-loading-row">
    <template v-if="variant === 'portfolio'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="20px"
          width="42px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-identity">
          <VSkeleton
            height="55px"
            width="55px"
            radius="6px"
          />
          <div class="v-table-responsive-loading-row__desktop-stack">
            <VSkeleton
              height="20px"
              width="130px"
            />
            <VSkeleton
              height="14px"
              width="72px"
            />
          </div>
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="96px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="22px"
          width="88px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="72px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="84px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="24px"
          width="84px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="16px"
        />
      </VTableCell>
    </template>

    <template v-else-if="variant === 'distribution'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="20px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="20px"
          width="42px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-identity">
          <VSkeleton
            height="55px"
            width="55px"
            radius="6px"
          />
          <div class="v-table-responsive-loading-row__desktop-stack">
            <VSkeleton
              height="20px"
              width="140px"
            />
            <VSkeleton
              height="14px"
              width="88px"
            />
          </div>
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="104px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="22px"
          width="96px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="72px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="22px"
          width="118px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="24px"
          width="84px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="16px"
        />
      </VTableCell>
    </template>

    <template v-else-if="variant === 'wallet-token'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-identity">
          <VSkeleton
            height="38px"
            width="38px"
            radius="999px"
          />
          <div class="v-table-responsive-loading-row__desktop-stack">
            <VSkeleton
              height="20px"
              width="250px"
            />
            <VSkeleton
              height="14px"
              width="54px"
            />
          </div>
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="20px"
          width="76px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-inline">
          <VSkeleton
            height="20px"
            width="84px"
          />
          <VSkeleton
            height="14px"
            width="14px"
          />
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-end">
          <VSkeleton
            height="16px"
            width="14px"
          />
        </div>
      </VTableCell>
    </template>

    <template v-else-if="variant === 'wallet-transaction'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-stack">
          <VSkeleton
            height="18px"
            width="84px"
          />
          <VSkeleton
            height="14px"
            width="60px"
          />
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="16px"
          width="72px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-stack">
          <VSkeleton
            height="18px"
            width="90px"
          />
          <VSkeleton
            height="14px"
            width="54px"
          />
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="16px"
          width="180px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="24px"
          width="76px"
        />
      </VTableCell>
    </template>

    <template v-else-if="variant === 'yield'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="22px"
          width="62px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="94px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="22px"
          width="56px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-desktop-show">
        <VSkeleton
          height="18px"
          width="64px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-desktop-show">
        <VSkeleton
          height="18px"
          width="64px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-desktop-show">
        <VSkeleton
          height="18px"
          width="72px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-desktop-show">
        <VSkeleton
          height="24px"
          width="92px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-desktop-show">
        <div class="v-table-responsive-loading-row__desktop-end">
          <VSkeleton
            height="18px"
            width="48px"
          />
        </div>
      </VTableCell>
    </template>

    <template v-else-if="variant === 'document'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-inline">
          <VSkeleton
            height="20px"
            width="20px"
          />
          <VSkeleton
            height="18px"
            width="180px"
          />
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="24px"
          width="64px"
        />
      </VTableCell>
      <VTableCell
        v-if="columns > 2"
        class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show"
      >
        <VSkeleton
          height="16px"
          width="84px"
        />
      </VTableCell>
      <VTableCell
        v-if="columns > 3"
        class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show"
      >
        <div class="v-table-responsive-loading-row__desktop-end">
          <VSkeleton
            height="18px"
            width="72px"
          />
        </div>
      </VTableCell>
    </template>

    <template v-else-if="variant === 'activity'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-stack">
          <VSkeleton
            height="18px"
            width="92px"
          />
          <VSkeleton
            height="14px"
            width="58px"
          />
        </div>
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="110px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="600px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <div class="v-table-responsive-loading-row__desktop-end">
          <VSkeleton
            height="32px"
            width="112px"
          />
        </div>
      </VTableCell>
    </template>

    <template v-else-if="variant === 'beneficial'">
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="84px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="92px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="104px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="118px"
        />
      </VTableCell>
      <VTableCell class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show">
        <VSkeleton
          height="18px"
          width="148px"
        />
      </VTableCell>
    </template>

    <template v-else>
      <VTableCell
        v-for="column in columns"
        :key="`desktop-${column}`"
        class="v-table-responsive-loading-row__desktop-cell is--gt-tablet-show"
      >
        <VSkeleton
          height="26px"
          width="100%"
        />
      </VTableCell>
    </template>

    <td
      :colspan="columns"
      class="v-table-responsive-loading-row__mobile-cell is--lt-tablet-show"
    >
      <div
        class="v-table-responsive-loading-row__mobile-card"
        :class="`is--${variant}`"
      >
        <template v-if="variant === 'portfolio'">
          <div class="v-table-responsive-loading-row__badge">
            <VSkeleton
              height="24px"
              width="84px"
              radius="999px"
            />
          </div>
          <VSkeleton
            height="150px"
            width="100%"
            class="v-table-responsive-loading-row__image"
          />
          <VSkeleton
            height="24px"
            width="68%"
            class="v-table-responsive-loading-row__center-line"
          />
          <div class="v-table-responsive-loading-row__grid">
            <VSkeleton
              height="18px"
              width="30%"
            />
            <VSkeleton
              height="18px"
              width="30%"
            />
            <VSkeleton
              height="18px"
              width="30%"
            />
            <VSkeleton
              height="18px"
              width="30%"
            />
          </div>
        </template>

        <template v-else-if="variant === 'distribution'">
          <div class="v-table-responsive-loading-row__top-row">
            <VSkeleton
              height="24px"
              width="84px"
              radius="999px"
            />
            <VSkeleton
              height="18px"
              width="20px"
            />
          </div>
          <div class="v-table-responsive-loading-row__identity">
            <VSkeleton
              height="56px"
              width="56px"
              class="v-table-responsive-loading-row__avatar"
              radius="6px"
            />
            <div class="v-table-responsive-loading-row__identity-text">
              <VSkeleton
                height="20px"
                width="72%"
              />
              <VSkeleton
                height="16px"
                width="48%"
              />
            </div>
          </div>
          <div class="v-table-responsive-loading-row__grid">
            <VSkeleton
              height="18px"
              width="26%"
            />
            <VSkeleton
              height="18px"
              width="34%"
            />
            <VSkeleton
              height="18px"
              width="34%"
            />
            <VSkeleton
              height="18px"
              width="30%"
            />
            <VSkeleton
              height="18px"
              width="42%"
            />
            <VSkeleton
              height="18px"
              width="36%"
            />
          </div>
        </template>

        <template v-else-if="variant === 'wallet-token'">
          <div class="v-table-responsive-loading-row__top-row">
            <div class="v-table-responsive-loading-row__identity">
              <VSkeleton
                height="38px"
                width="38px"
                class="v-table-responsive-loading-row__avatar"
                radius="999px"
              />
              <div class="v-table-responsive-loading-row__identity-text">
                <VSkeleton
                  height="20px"
                  width="110px"
                />
                <VSkeleton
                  height="14px"
                  width="54px"
                />
              </div>
            </div>
            <div class="v-table-responsive-loading-row__right-stack">
              <VSkeleton
                height="20px"
                width="72px"
              />
              <VSkeleton
                height="14px"
                width="56px"
              />
            </div>
          </div>
        </template>

        <template v-else-if="variant === 'wallet-transaction'">
          <div class="v-table-responsive-loading-row__top-row">
            <div class="v-table-responsive-loading-row__left-stack">
              <VSkeleton
                height="18px"
                width="86px"
              />
              <VSkeleton
                height="14px"
                width="62px"
              />
            </div>
            <div class="v-table-responsive-loading-row__right-stack">
              <VSkeleton
                height="20px"
                width="82px"
              />
              <VSkeleton
                height="24px"
                width="74px"
                radius="999px"
              />
            </div>
          </div>
          <VSkeleton
            height="16px"
            width="72px"
          />
          <VSkeleton
            height="18px"
            width="42%"
          />
          <VSkeleton
            height="16px"
            width="88%"
          />
        </template>

        <template v-else-if="variant === 'yield'">
          <div class="v-table-responsive-loading-row__top-row">
            <VSkeleton
              height="22px"
              width="72px"
            />
            <VSkeleton
              height="22px"
              width="24%"
            />
            <VSkeleton
              height="22px"
              width="78px"
            />
          </div>
        </template>

        <template v-else-if="variant === 'document'">
          <div class="v-table-responsive-loading-row__top-row">
            <div class="v-table-responsive-loading-row__identity">
              <VSkeleton
                height="20px"
                width="20px"
              />
              <VSkeleton
                height="18px"
                width="160px"
              />
            </div>
            <VSkeleton
              height="22px"
              width="54px"
              radius="999px"
            />
          </div>
        </template>

        <template v-else-if="variant === 'activity'">
          <div class="v-table-responsive-loading-row__grid">
            <VSkeleton
              height="76px"
              width="44%"
            />
            <VSkeleton
              height="20px"
              width="50%"
            />
          </div>
          <VSkeleton
            height="90px"
            width="100%"
          />
          <VSkeleton
            height="34px"
            width="100%"
          />
        </template>

        <template v-else-if="variant === 'beneficial'">
          <div class="v-table-responsive-loading-row__grid">
            <VSkeleton
              height="18px"
              width="40%"
            />
            <VSkeleton
              height="18px"
              width="46%"
            />
            <VSkeleton
              height="18px"
              width="38%"
            />
            <VSkeleton
              height="18px"
              width="58%"
            />
            <VSkeleton
              height="18px"
              width="76%"
            />
          </div>
        </template>

        <template v-else>
          <div class="v-table-responsive-loading-row__grid">
            <VSkeleton
              height="18px"
              width="34%"
            />
            <VSkeleton
              height="18px"
              width="56%"
            />
            <VSkeleton
              height="18px"
              width="28%"
            />
            <VSkeleton
              height="18px"
              width="44%"
            />
          </div>
        </template>
      </div>
    </td>
  </VTableRow>
</template>

<style lang="scss" scoped>
@use 'UiKit/styles/_variables.scss' as *;

.v-table-responsive-loading-row {
  &__desktop-cell {
    vertical-align: middle;
  }

  &__desktop-identity,
  &__desktop-inline,
  &__desktop-end {
    display: flex;
    align-items: center;
  }

  &__desktop-identity,
  &__desktop-inline {
    gap: 12px;
  }

  &__desktop-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__desktop-end {
    justify-content: flex-end;
  }

  &__mobile-cell {
    padding: 0;
  }

  &__mobile-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  &__badge {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 1;
  }

  &__image {
    margin-bottom: 4px;
  }

  &__center-line {
    align-self: center;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 12px;
    align-items: center;
  }

  &__top-row,
  &__bottom-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__bottom-row {
    align-items: center;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  &__identity-text,
  &__left-stack,
  &__right-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__right-stack {
    align-items: flex-end;
  }

  &__button {
    margin-left: auto;
  }

  .is--portfolio {
    position: relative;
  }

  .is--distribution,
  .is--yield,
  .is--beneficial,
  .is--activity,
  .is--default {
    padding-top: 16px;
    padding-bottom: 16px;
  }

  @media screen and (min-width: $tablet) {
    &__mobile-cell {
      display: none;
    }
  }

  @media screen and (max-width: $tablet) {
    &__desktop-cell {
      display: none;
    }
  }
}
</style>
