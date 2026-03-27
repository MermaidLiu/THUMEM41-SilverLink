<script setup lang="ts">
import { ref } from "vue";
import { FAMILY_CONDITIONS, FAMILY_RELATIONS, PAST_OPTIONS } from "@/constants/options";
import type { FamilyItem, IntakeDraft } from "@/utils/intake";
import { loadDraft, saveDraft } from "@/utils/intake";

const draft = ref<IntakeDraft>(loadDraft());

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

const famRel = ref(FAMILY_RELATIONS[0]);
const famCond = ref(FAMILY_CONDITIONS[0]);

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
  famRel.value = FAMILY_RELATIONS[Number(e.detail.value)];
}

function onPickCond(e: { detail: { value: string } }) {
  famCond.value = FAMILY_CONDITIONS[Number(e.detail.value)];
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
  <view class="page">
    <view class="card">
      <text class="h">既往病史（多选）</text>
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

    <view class="card">
      <text class="h">家族病史</text>
      <view class="fam-row">
        <picker mode="selector" :range="FAMILY_RELATIONS" @change="onPickRel">
          <view class="picker half">{{ famRel }}</view>
        </picker>
        <picker mode="selector" :range="FAMILY_CONDITIONS" @change="onPickCond">
          <view class="picker half">{{ famCond }}</view>
        </picker>
        <button class="add" size="mini" type="primary" @click="addFamily">添加</button>
      </view>
      <view v-for="(f, i) in draft.family_history" :key="i" class="fam-item">
        <text>{{ f.relation }} · {{ f.condition }}</text>
        <text class="del" @click="removeFamily(i)">删除</text>
      </view>
    </view>

    <view class="row-btns">
      <button class="btn ghost" @click="skip">跳过</button>
      <button class="btn primary" type="primary" @click="next">确认并继续</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid #e2e8f0;
}
.h {
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.chip {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  font-size: 24rpx;
}
.chip.on {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}
.fam-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  align-items: center;
}
.picker {
  padding: 16rpx 20rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
  font-size: 26rpx;
}
.picker.half {
  min-width: 200rpx;
}
.add {
  margin-left: auto;
}
.fam-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  font-size: 26rpx;
}
.del {
  color: #dc2626;
}
.row-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.row-btns .btn {
  flex: 1;
  border-radius: 16rpx;
}
.ghost {
  background: #fff;
  border: 1rpx solid #cbd5e1;
}
</style>
