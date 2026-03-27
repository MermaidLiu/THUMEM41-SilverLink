<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import LangSwitcher from "@/components/LangSwitcher.vue";
import { ensurePatient, getAuth, logout } from "@/utils/auth";
import { clearDraft, defaultDraft, loadDraft, saveDraft, type LanguageMode } from "@/utils/intake";
import { useNavTitle } from "@/utils/useNavTitle";

const { t } = useI18n();
useNavTitle("nav.patientHome");

const lang = ref<LanguageMode>("mandarin");
const displayName = ref("");

onShow(() => {
  if (!ensurePatient()) return;
  displayName.value = getAuth()?.displayName ?? "";
});

function onLangChange(e: { detail: { value: string } }) {
  lang.value = e.detail.value as LanguageMode;
}

function welcomeLine() {
  const name = displayName.value || t("patient.home.guest");
  return t("patient.home.welcome", { name });
}

function start() {
  clearDraft();
  const d = defaultDraft();
  d.language = lang.value;
  saveDraft(d);
  uni.navigateTo({ url: "/pages/patient/symptom" });
}

function resume() {
  const d = loadDraft();
  if (d.transcript || d.pain_locations.length) {
    uni.navigateTo({ url: "/pages/patient/symptom" });
  } else {
    uni.showToast({ title: t("patient.home.noDraft"), icon: "none" });
  }
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

    <view class="sl-card">
      <text class="welcome">{{ welcomeLine() }}</text>
      <text class="label">{{ t("patient.home.speechTitle") }}</text>
      <radio-group @change="onLangChange">
        <label class="row">
          <radio value="mandarin" :checked="lang === 'mandarin'" color="#7c3aed" />
          <text>{{ t("patient.home.mandarin") }}</text>
        </label>
        <label class="row">
          <radio value="dialect" :checked="lang === 'dialect'" color="#7c3aed" />
          <text>{{ t("patient.home.dialect") }}</text>
        </label>
      </radio-group>
    </view>
    <button class="sl-btn-primary" type="primary" @click="start">{{ t("patient.home.start") }}</button>
    <button class="sl-link" @click="resume">{{ t("patient.home.resume") }}</button>
    <button class="sl-btn-ghost logout" @click="doLogout">{{ t("patient.home.logout") }}</button>
  </view>
</template>

<style lang="scss" scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.lang-label {
  font-size: 24rpx;
  color: #6b21a8;
  opacity: 0.85;
}
.welcome {
  font-size: 28rpx;
  color: #5b21b6;
  line-height: 1.65;
  display: block;
  margin-bottom: 28rpx;
  opacity: 0.95;
}
.label {
  font-weight: 700;
  color: #4c1d95;
  margin-bottom: 16rpx;
  display: block;
  font-size: 28rpx;
}
.row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
  font-size: 28rpx;
  color: #312e81;
}
button {
  margin-top: 20rpx;
}
.logout {
  margin-top: 48rpx;
}
</style>
