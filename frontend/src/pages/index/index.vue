<script setup lang="ts">
function goPatient() {
  uni.navigateTo({ url: "/pages/patient/home" });
}
function goDoctor() {
  uni.navigateTo({ url: "/pages/doctor/list" });
}
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="title">SilverLink AI</text>
      <text class="sub">医患沟通辅助 · 预问诊信息整理（非诊断）</text>
    </view>
    <view class="actions">
      <button class="btn primary" type="primary" @click="goPatient">患者端</button>
      <button class="btn ghost" @click="goDoctor">医生端</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 48rpx 40rpx;
  box-sizing: border-box;
}
.hero {
  margin-bottom: 64rpx;
}
.title {
  font-size: 44rpx;
  font-weight: 700;
  color: #0f172a;
  display: block;
}
.sub {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #64748b;
  display: block;
  line-height: 1.5;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.btn {
  border-radius: 16rpx;
  font-size: 30rpx;
}
.ghost {
  background: #fff;
  color: #2563eb;
  border: 2rpx solid #bfdbfe;
}
</style>
