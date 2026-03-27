<script setup lang="ts">
import { onShow, ref } from "vue";
import { apiGet } from "@/utils/api";

interface Row {
  patient_id: string;
  patient_name?: string;
  status: string;
  chief_complaint?: { summary?: string };
}

const list = ref<Row[]>([]);
const err = ref("");

async function load() {
  err.value = "";
  try {
    const rows = await apiGet<Row[]>("/api/doctor/patients");
    list.value = rows;
  } catch {
    err.value = "无法加载列表，请确认后端已启动且本机可访问接口地址。";
  }
}

onShow(() => {
  load();
});

function open(id: string) {
  uni.navigateTo({ url: `/pages/doctor/detail?id=${encodeURIComponent(id)}` });
}
</script>

<template>
  <view class="page">
    <view v-if="err" class="banner">{{ err }}</view>
    <view v-if="!list.length && !err" class="empty">暂无候诊记录，请让患者端先提交一条问诊。</view>
    <view v-for="p in list" :key="p.patient_id" class="card" @click="open(p.patient_id)">
      <view class="top">
        <text class="id">{{ p.patient_id }}</text>
        <text class="st">{{ p.status }}</text>
      </view>
      <text class="name">{{ p.patient_name || "匿名患者" }}</text>
      <text class="sum">{{ p.chief_complaint?.summary || "（无主诉摘要）" }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx;
  box-sizing: border-box;
}
.banner {
  background: #fef3c7;
  color: #92400e;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  margin-bottom: 16rpx;
  line-height: 1.5;
}
.empty {
  color: #64748b;
  font-size: 26rpx;
  padding: 40rpx 0;
  text-align: center;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #e2e8f0;
}
.top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.id {
  font-weight: 700;
  font-size: 28rpx;
}
.st {
  font-size: 22rpx;
  color: #64748b;
  text-transform: uppercase;
}
.name {
  font-size: 26rpx;
  color: #334155;
  display: block;
  margin-bottom: 8rpx;
}
.sum {
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.5;
  display: block;
}
</style>
