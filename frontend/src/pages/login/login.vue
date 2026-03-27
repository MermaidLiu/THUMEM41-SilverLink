<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import LangSwitcher from "@/components/LangSwitcher.vue";
import { getAuth, tryLogin, setAuth } from "@/utils/auth";
import { useNavTitle } from "@/utils/useNavTitle";

const { t } = useI18n();
useNavTitle("nav.login");

const username = ref("");
const password = ref("");
const loading = ref(false);
const err = ref("");

onShow(() => {
  const a = getAuth();
  if (a?.role === "patient") {
    uni.reLaunch({ url: "/pages/patient/home" });
  } else if (a?.role === "doctor") {
    uni.reLaunch({ url: "/pages/doctor/list" });
  }
});

function submit() {
  err.value = "";
  loading.value = true;
  try {
    const u = username.value.trim();
    const p = password.value;
    if (!u || !p) {
      err.value = t("login.errEmpty");
      return;
    }
    const session = tryLogin(u, p);
    if (!session) {
      err.value = t("login.errAuth");
      return;
    }
    setAuth(session);
    if (session.role === "patient") {
      uni.reLaunch({ url: "/pages/patient/home" });
    } else {
      uni.reLaunch({ url: "/pages/doctor/list" });
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="page sl-page-auth">
    <view class="top-bar">
      <text class="lang-label">{{ t("lang.switch") }}</text>
      <LangSwitcher />
    </view>

    <view class="brand">
      <text class="logo">{{ t("login.brand") }}</text>
      <text class="sub">{{ t("login.slogan") }}</text>
    </view>

    <view class="sl-card glass">
      <text class="title">{{ t("login.title") }}</text>
      <text class="tip">{{ t("login.tip") }}</text>
      <view class="field">
        <input v-model="username" class="sl-input" :placeholder="t('login.username')" />
      </view>
      <view class="field">
        <input v-model="password" class="sl-input" password :placeholder="t('login.password')" />
      </view>
      <view v-if="err" class="err">{{ err }}</view>
      <button class="sl-btn-primary" type="primary" :loading="loading" @click="submit">{{ t("login.submit") }}</button>
    </view>

    <view class="sl-card glass hint-card">
      <text class="hint-title">{{ t("login.demoTitle") }}</text>
      <text class="hint-line">{{ t("login.demoPatient") }}</text>
      <text class="hint-line">{{ t("login.demoDoctor") }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 32rpx 40rpx 80rpx;
  box-sizing: border-box;
  background: linear-gradient(168deg, #ede9fe 0%, #fae8ff 38%, #ddd6fe 72%, #e9d5ff 100%);
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.lang-label {
  font-size: 24rpx;
  color: #6b21a8;
  opacity: 0.85;
}
.brand {
  margin-bottom: 40rpx;
}
.logo {
  font-size: 52rpx;
  font-weight: 800;
  color: #5b21b6;
  letter-spacing: 2rpx;
  display: block;
}
.sub {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #6b21a8;
  opacity: 0.88;
  line-height: 1.5;
  display: block;
}
.glass {
  background: rgba(255, 255, 255, 0.45);
  border: 2rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 32rpx;
  padding: 36rpx 32rpx;
  box-shadow: 0 12rpx 48rpx rgba(109, 40, 217, 0.12);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  margin-bottom: 28rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 700;
  color: #4c1d95;
  display: block;
  margin-bottom: 12rpx;
}
.tip {
  font-size: 24rpx;
  color: #6d28d9;
  opacity: 0.85;
  line-height: 1.55;
  display: block;
  margin-bottom: 28rpx;
}
.field {
  width: 100%;
  display: block;
  margin-bottom: 22rpx;
  box-sizing: border-box;
}
.sl-input {
  width: 100%;
  max-width: 100%;
  min-height: 96rpx;
  padding: 22rpx 28rpx;
  box-sizing: border-box;
  border-radius: 20rpx;
  border: 2rpx solid rgba(167, 139, 250, 0.45);
  background: rgba(255, 255, 255, 0.55);
  font-size: 30rpx;
  line-height: 44rpx;
  color: #1e1b4b;
  display: block;
}
.err {
  color: #b91c1c;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}
.sl-btn-primary {
  margin-top: 12rpx;
  width: 100%;
  border-radius: 22rpx !important;
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 45%, #a78bfa 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600;
  box-shadow: 0 10rpx 32rpx rgba(124, 58, 237, 0.38);
}
.hint-card {
  padding: 28rpx 32rpx;
}
.hint-title {
  font-weight: 700;
  color: #5b21b6;
  font-size: 28rpx;
  display: block;
  margin-bottom: 12rpx;
}
.hint-line {
  display: block;
  font-size: 24rpx;
  color: #6b21a8;
  line-height: 1.7;
  opacity: 0.92;
}
</style>
