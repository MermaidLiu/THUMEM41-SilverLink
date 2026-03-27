<script setup lang="ts">
import { ref } from "vue";
import { clearDraft, defaultDraft, loadDraft, saveDraft, type LanguageMode } from "@/utils/intake";

const lang = ref<LanguageMode>("mandarin");

function onLangChange(e: { detail: { value: string } }) {
  lang.value = e.detail.value as LanguageMode;
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
    uni.showToast({ title: "暂无草稿", icon: "none" });
  }
}
</script>

<template>
  <view class="page">
    <text class="welcome">您好，接下来将引导您描述症状，便于医生提前了解情况。</text>
    <view class="card">
      <text class="label">交流语言</text>
      <radio-group @change="onLangChange">
        <label class="row">
          <radio value="mandarin" :checked="lang === 'mandarin'" color="#2563eb" />
          <text>普通话</text>
        </label>
        <label class="row">
          <radio value="dialect" :checked="lang === 'dialect'" color="#2563eb" />
          <text>方言（P0 仍以普通话识别为主）</text>
        </label>
      </radio-group>
    </view>
    <button class="btn primary" type="primary" @click="start">开始问诊</button>
    <button class="btn link" @click="resume">继续上次草稿</button>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 32rpx;
  box-sizing: border-box;
}
.welcome {
  font-size: 28rpx;
  color: #334155;
  line-height: 1.6;
  display: block;
  margin-bottom: 32rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  border: 1rpx solid #e2e8f0;
}
.label {
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}
.row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
}
.btn {
  margin-top: 16rpx;
  border-radius: 16rpx;
}
.link {
  background: transparent;
  color: #2563eb;
  border: none;
}
</style>
