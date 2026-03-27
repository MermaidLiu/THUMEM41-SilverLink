<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { SUPPORTED_LOCALES, type LocaleCode } from "@/locales/clinical";
import { setAppLocale } from "@/i18n";

const { locale } = useI18n();
const labels = SUPPORTED_LOCALES.map((x) => x.label);

const currentIndex = computed(() => {
  const code = locale.value as LocaleCode;
  const i = SUPPORTED_LOCALES.findIndex((x) => x.code === code);
  return i >= 0 ? i : 0;
});

function onPick(e: { detail: { value: string } }) {
  const i = Number(e.detail.value);
  const row = SUPPORTED_LOCALES[i];
  if (row) setAppLocale(row.code);
}
</script>

<template>
  <view class="wrap">
    <text class="ico">🌐</text>
    <picker mode="selector" :range="labels" :value="currentIndex" @change="onPick">
      <view class="pill">{{ labels[currentIndex] }}</view>
    </picker>
  </view>
</template>

<style lang="scss" scoped>
.wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.ico {
  font-size: 28rpx;
  opacity: 0.9;
}
.pill {
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.55);
  border: 2rpx solid rgba(167, 139, 250, 0.45);
  font-size: 24rpx;
  color: #5b21b6;
  font-weight: 600;
}
</style>
