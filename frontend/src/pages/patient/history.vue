<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import LangSwitcher from "@/components/LangSwitcher.vue";
import { getFamilyConditions, getFamilyRelations, getPastOptions } from "@/locales/clinical";
import { ensurePatient } from "@/utils/auth";
import type { FamilyItem, IntakeDraft } from "@/utils/intake";
import { loadDraft, saveDraft } from "@/utils/intake";
import { useNavTitle } from "@/utils/useNavTitle";

const { t, locale } = useI18n();
useNavTitle("nav.history");

const draft = ref<IntakeDraft>(loadDraft());

const PAST_OPTIONS = computed(() => getPastOptions(locale.value));
const FAMILY_RELATIONS = computed(() => getFamilyRelations(locale.value));
const FAMILY_CONDITIONS = computed(() => getFamilyConditions(locale.value));

const famRel = ref("");
const famCond = ref("");

watch(
  FAMILY_RELATIONS,
  (arr) => {
    if (!arr.length) return;
    if (!famRel.value || !arr.includes(famRel.value)) famRel.value = arr[0];
  },
  { immediate: true }
);

watch(
  FAMILY_CONDITIONS,
  (arr) => {
    if (!arr.length) return;
    if (!famCond.value || !arr.includes(famCond.value)) famCond.value = arr[0];
  },
  { immediate: true }
);

onShow(() => {
  ensurePatient();
});

function persist() {
  saveDraft(draft.value);
}

function togglePast(label: string) {
  const arr = draft.value.past_medical_history;
  const i = arr.indexOf(label);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(label);
  persist();
}

function isPast(label: string) {
  return draft.value.past_medical_history.includes(label);
}

function addFamily() {
  const row: FamilyItem = { relation: famRel.value, condition: famCond.value };
  draft.value.family_history.push(row);
  persist();
}

function removeFamily(i: number) {
  draft.value.family_history.splice(i, 1);
  persist();
}

function onPickRel(e: { detail: { value: string } }) {
  const arr = FAMILY_RELATIONS.value;
  famRel.value = arr[Number(e.detail.value)] ?? arr[0];
}

function onPickCond(e: { detail: { value: string } }) {
  const arr = FAMILY_CONDITIONS.value;
  famCond.value = arr[Number(e.detail.value)] ?? arr[0];
}

function skip() {
  uni.navigateTo({ url: "/pages/patient/confirm" });
}

function next() {
  persist();
  uni.navigateTo({ url: "/pages/patient/confirm" });
}
</script>

<template>
  <view class="page sl-page">
    <view class="top-bar">
      <text class="lang-label">{{ t("lang.switch") }}</text>
      <LangSwitcher />
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("patient.history.pastTitle") }}</text>
      <view class="chips">
        <view
          v-for="opt in PAST_OPTIONS"
          :key="opt"
          :class="['chip', isPast(opt) ? 'on' : '']"
          @click="togglePast(opt)"
        >
          <text>{{ opt }}</text>
        </view>
      </view>
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("patient.history.famTitle") }}</text>
      <view class="fam-row">
        <picker mode="selector" :range="FAMILY_RELATIONS" @change="onPickRel">
          <view class="picker half">{{ famRel }}</view>
        </picker>
        <picker mode="selector" :range="FAMILY_CONDITIONS" @change="onPickCond">
          <view class="picker half">{{ famCond }}</view>
        </picker>
        <button class="add" size="mini" type="primary" @click="addFamily">{{ t("patient.history.add") }}</button>
      </view>
      <view v-for="(f, i) in draft.family_history" :key="i" class="fam-item">
        <text>{{ f.relation }} · {{ f.condition }}</text>
        <text class="del" @click="removeFamily(i)">{{ t("patient.history.del") }}</text>
      </view>
    </view>

    <view class="row-btns">
      <button class="sl-btn-ghost" @click="skip">{{ t("patient.history.skip") }}</button>
      <button class="sl-btn-primary" type="primary" @click="next">{{ t("patient.history.next") }}</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.lang-label {
  font-size: 24rpx;
  color: #6b21a8;
  opacity: 0.85;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.chip {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.5);
  border: 2rpx solid rgba(167, 139, 250, 0.35);
  font-size: 24rpx;
  color: #312e81;
}
.chip.on {
  background: rgba(167, 139, 250, 0.45);
  border-color: #7c3aed;
  color: #4c1d95;
  font-weight: 600;
}
.fam-row {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: stretch;
}
.picker {
  flex: 1;
  min-width: 0;
  padding: 22rpx 24rpx;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 16rpx;
  border: 2rpx solid rgba(167, 139, 250, 0.35);
  font-size: 30rpx;
  line-height: 44rpx;
  color: #312e81;
  box-sizing: border-box;
  min-height: 92rpx;
}
.picker.half {
  width: 100%;
}
.add {
  width: 100%;
  margin-top: 4rpx;
}
.fam-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 2rpx solid rgba(167, 139, 250, 0.2);
  font-size: 26rpx;
  color: #312e81;
}
.del {
  color: #9333ea;
}
.row-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.row-btns button {
  flex: 1;
}
</style>
