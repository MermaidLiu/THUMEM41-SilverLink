<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import LangSwitcher from "@/components/LangSwitcher.vue";
import { getPainLabel } from "@/locales/clinical";
import { apiGet } from "@/utils/api";
import { ensureDoctor, getAuth, logout } from "@/utils/auth";
import { useNavTitle } from "@/utils/useNavTitle";

const { t, locale } = useI18n();
useNavTitle("nav.doctorList");

interface Row {
  patient_id: string;
  patient_name?: string;
  status: string;
  chief_complaint?: {
    summary?: string;
    severity?: number | null;
    quality?: string;
    onset?: string;
  };
}

function painLabel(id: string | undefined) {
  if (!id) return "";
  return getPainLabel(locale.value, id);
}

const list = ref<Row[]>([]);
const err = ref("");
const doctorName = ref("");

async function load() {
  if (!ensureDoctor()) return;
  doctorName.value = getAuth()?.displayName ?? "";
  err.value = "";
  try {
    const rows = await apiGet<Row[]>("/api/doctor/patients");
    list.value = rows;
  } catch {
    err.value = t("doctor.list.err");
  }
}

onShow(() => {
  load();
});

function open(id: string) {
  uni.navigateTo({ url: `/pages/doctor/detail?id=${encodeURIComponent(id)}` });
}

function doLogout() {
  logout();
}
</script>

<template>
  <view class="page sl-page">
    <view class="top-bar">
      <text class="lang-label">{{ t("lang.switch") }}</text>
      <LangSwitcher />
    </view>

    <view class="sl-card head-card">
      <text class="hello">{{ doctorName ? t("doctor.list.hello", { name: doctorName }) : t("doctor.list.desk") }}</text>
      <text class="sub">{{ t("doctor.list.sub") }}</text>
      <text v-if="list.some((p) => String(p.patient_id).startsWith('DEMO'))" class="demo-hint">{{ t("doctor.list.demoHint") }}</text>
      <button class="sl-btn-ghost mini-out" @click="doLogout">{{ t("doctor.list.logout") }}</button>
    </view>
    <view v-if="err" class="banner">{{ err }}</view>
    <view v-if="!list.length && !err" class="empty">{{ t("doctor.list.empty") }}</view>
    <view v-for="p in list" :key="p.patient_id" class="sl-card row-card" @click="open(p.patient_id)">
      <view class="top">
        <text class="id">{{ p.patient_id }}</text>
        <text class="st">{{ p.status }}</text>
      </view>
      <text class="name">{{ p.patient_name || t("doctor.list.anon") }}</text>
      <view
        v-if="p.chief_complaint?.severity != null || p.chief_complaint?.quality || p.chief_complaint?.onset"
        class="chip-row"
      >
        <text v-if="p.chief_complaint?.severity != null" class="chip sev">{{ p.chief_complaint.severity }}/10</text>
        <text v-if="p.chief_complaint?.quality" class="chip">{{ painLabel(p.chief_complaint.quality) }}</text>
        <text v-if="p.chief_complaint?.onset" class="chip dim">{{ p.chief_complaint.onset }}</text>
      </view>
      <text class="sum">{{ p.chief_complaint?.summary || t("doctor.list.noSummary") }}</text>
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
.head-card {
  position: relative;
  padding-bottom: 24rpx;
}
.hello {
  font-size: 32rpx;
  font-weight: 700;
  color: #4c1d95;
  display: block;
}
.sub {
  font-size: 24rpx;
  color: #6b21a8;
  opacity: 0.88;
  margin-top: 8rpx;
  display: block;
}
.demo-hint {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #7c3aed;
  line-height: 1.45;
  display: block;
  opacity: 0.9;
}
.mini-out {
  margin-top: 20rpx;
  font-size: 24rpx;
}
.banner {
  background: rgba(254, 243, 199, 0.85);
  color: #92400e;
  padding: 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  margin-bottom: 16rpx;
  line-height: 1.5;
  border: 2rpx solid rgba(251, 191, 36, 0.35);
}
.empty {
  color: #6b21a8;
  font-size: 26rpx;
  padding: 24rpx 0 40rpx;
  text-align: center;
  opacity: 0.9;
  line-height: 1.55;
}
.row-card {
  padding: 26rpx;
}
.top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.id {
  font-weight: 700;
  font-size: 28rpx;
  color: #4c1d95;
}
.st {
  font-size: 22rpx;
  color: #7c3aed;
  text-transform: uppercase;
}
.name {
  font-size: 26rpx;
  color: #312e81;
  display: block;
  margin-bottom: 8rpx;
}
.sum {
  font-size: 24rpx;
  color: #5b21b6;
  line-height: 1.5;
  display: block;
  opacity: 0.88;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 10rpx;
}
.chip {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(167, 139, 250, 0.35);
  color: #4c1d95;
}
.chip.sev {
  background: rgba(124, 58, 237, 0.25);
  font-weight: 700;
}
.chip.dim {
  background: rgba(255, 255, 255, 0.5);
  color: #6b21a8;
}
</style>
