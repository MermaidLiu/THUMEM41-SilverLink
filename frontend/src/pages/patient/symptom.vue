<script setup lang="ts">
import { computed, ref } from "vue";
import BodyTapMap from "@/components/BodyTapMap.vue";
import { PAIN_TYPES } from "@/constants/options";
import { apiPost } from "@/utils/api";
import type { IntakeDraft, PainLocation } from "@/utils/intake";
import { loadDraft, saveDraft } from "@/utils/intake";

const draft = ref<IntakeDraft>(loadDraft());
const simText = ref("");
const loadingAsr = ref(false);
const loadingAi = ref(false);
const palette = ["#ef4444", "#f97316", "#ca8a04", "#16a34a", "#2563eb"];

const panelOpen = ref(false);
const editing = ref<PainLocation | null>(null);
const editPainType = ref("dull");
const editSeverity = ref(5);
const editDuration = ref("");

function persist() {
  saveDraft(draft.value);
}

function colorForIndex(i: number) {
  return palette[i % palette.length];
}

function openPanel(part: string) {
  const existing = draft.value.pain_locations.find((p) => p.body_part === part);
  if (existing) {
    editing.value = { ...existing };
  } else {
    editing.value = { body_part: part, pain_type: "dull", severity: 5, duration: "" };
  }
  editPainType.value = editing.value.pain_type;
  editSeverity.value = editing.value.severity;
  editDuration.value = editing.value.duration;
  panelOpen.value = true;
}

function closePanel() {
  panelOpen.value = false;
  editing.value = null;
}

function onPickPain(e: { detail: { value: string } }) {
  const i = Number(e.detail.value);
  const row = PAIN_TYPES[i];
  if (row) editPainType.value = row.id;
}

function saveMarker() {
  if (!editing.value) return;
  const next: PainLocation = {
    body_part: editing.value.body_part,
    pain_type: editPainType.value,
    severity: editSeverity.value,
    duration: editDuration.value.trim(),
  };
  const idx = draft.value.pain_locations.findIndex((p) => p.body_part === next.body_part);
  if (idx >= 0) draft.value.pain_locations.splice(idx, 1, next);
  else draft.value.pain_locations.push(next);
  persist();
  closePanel();
}

function removeMarker(part: string) {
  draft.value.pain_locations = draft.value.pain_locations.filter((p) => p.body_part !== part);
  persist();
}

async function mockVoice() {
  loadingAsr.value = true;
  try {
    const r = await apiPost<{ text: string }>("/api/asr/transcribe", {
      simulated_text: simText.value,
    });
    draft.value.transcript = r.text;
    draft.value.ai_conversation_log.push({ role: "patient", content: r.text });
    persist();
    uni.showToast({ title: "已填入转写", icon: "success" });
  } catch {
    uni.showToast({ title: "语音服务不可用", icon: "none" });
  } finally {
    loadingAsr.value = false;
  }
}

function existingSymptomsSummary() {
  const parts = draft.value.pain_locations
    .map((p) => `${p.body_part} ${p.severity}/10 ${p.pain_type}`)
    .join("；");
  return parts || "（尚未标注部位）";
}

async function askAi() {
  const last = draft.value.transcript.trim();
  if (!last) {
    uni.showToast({ title: "请先输入或转写症状", icon: "none" });
    return;
  }
  loadingAi.value = true;
  try {
    const r = await apiPost<{ question: string }>("/api/ai/follow-up", {
      user_input: last,
      existing_symptoms: existingSymptomsSummary(),
      conversation_log: draft.value.ai_conversation_log,
    });
    draft.value.ai_conversation_log.push({ role: "ai", content: r.question });
    persist();
  } catch {
    uni.showToast({ title: "追问服务不可用", icon: "none" });
  } finally {
    loadingAi.value = false;
  }
}

const selectedKeys = computed(() => draft.value.pain_locations.map((p) => p.body_part));

function nextStep() {
  persist();
  uni.navigateTo({ url: "/pages/patient/history" });
}
</script>

<template>
  <view class="page">
    <view class="card">
      <text class="h">语音录入（P0 模拟）</text>
      <textarea
        v-model="draft.transcript"
        class="area"
        placeholder="可直接输入，或使用下方模拟转写"
        @blur="persist"
      />
      <input v-model="simText" class="input" placeholder="模拟：希望 ASR 返回的文字（可留空）" />
      <button class="btn sm" :loading="loadingAsr" @click="mockVoice">模拟语音识别填入</button>
    </view>

    <view class="card">
      <text class="h">疼痛部位（点击示意图）</text>
      <BodyTapMap :selected-keys="selectedKeys" :color-for-index="colorForIndex" @tap="openPanel" />
      <view v-if="draft.pain_locations.length" class="tags">
        <view v-for="(p, i) in draft.pain_locations" :key="p.body_part" class="tag" @click="openPanel(p.body_part)">
          <view class="dot" :style="{ background: colorForIndex(i) }" />
          <text class="tag-t">{{ p.body_part }} · {{ p.severity }}/10</text>
          <text class="tag-x" @click.stop="removeMarker(p.body_part)">×</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="h">AI 引导追问</text>
      <button class="btn sm plain" :loading="loadingAi" @click="askAi">获取下一条追问</button>
      <scroll-view scroll-y class="bubbles">
        <view
          v-for="(m, idx) in draft.ai_conversation_log"
          :key="idx"
          :class="['bubble', m.role === 'ai' ? 'ai' : 'me']"
        >
          <text>{{ m.content }}</text>
        </view>
      </scroll-view>
    </view>

    <button class="btn primary foot" type="primary" @click="nextStep">下一步：病史采集</button>

    <view v-if="panelOpen && editing" class="mask" @click="closePanel">
      <view class="sheet" @click.stop>
        <text class="sheet-title">标注：{{ editing.body_part }}</text>
        <text class="mini">疼痛性质</text>
        <picker :value="Math.max(0, PAIN_TYPES.findIndex((t) => t.id === editPainType))" mode="selector" :range="PAIN_TYPES" range-key="label" @change="onPickPain">
          <view class="picker">{{ PAIN_TYPES.find((t) => t.id === editPainType)?.label }}</view>
        </picker>
        <text class="mini">程度 {{ editSeverity }}/10</text>
        <slider :value="editSeverity" min="1" max="10" show-value activeColor="#2563eb" @change="(e:any)=> editSeverity = Number(e.detail.value)" />
        <input v-model="editDuration" class="input" placeholder="持续时间，如 3_days、2_weeks" />
        <view class="row-btns">
          <button class="btn sm ghost" @click="closePanel">取消</button>
          <button class="btn sm primary" type="primary" @click="saveMarker">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx 24rpx 120rpx;
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
.area {
  width: 100%;
  min-height: 160rpx;
  padding: 16rpx;
  box-sizing: border-box;
  border: 1rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.input {
  margin-top: 12rpx;
  padding: 16rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.btn {
  margin-top: 16rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.btn.sm {
  font-size: 26rpx;
}
.btn.plain {
  background: #eff6ff;
  color: #1d4ed8;
  border: none;
}
.foot {
  margin-top: 8rpx;
}
.tags {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.tag {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
}
.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}
.tag-t {
  flex: 1;
  font-size: 26rpx;
}
.tag-x {
  color: #94a3b8;
  font-size: 36rpx;
  padding: 0 8rpx;
}
.bubbles {
  max-height: 320rpx;
  margin-top: 16rpx;
}
.bubble {
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  line-height: 1.5;
}
.bubble.me {
  background: #dbeafe;
  margin-left: 40rpx;
}
.bubble.ai {
  background: #f1f5f9;
  margin-right: 40rpx;
}
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: flex-end;
  z-index: 50;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 28rpx 28rpx 48rpx;
  box-sizing: border-box;
}
.sheet-title {
  font-weight: 700;
  font-size: 30rpx;
  margin-bottom: 20rpx;
  display: block;
}
.mini {
  font-size: 24rpx;
  color: #64748b;
  margin: 12rpx 0 8rpx;
  display: block;
}
.picker {
  padding: 20rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
}
.row-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.row-btns .btn {
  flex: 1;
}
.ghost {
  background: #fff;
  border: 1rpx solid #cbd5e1;
}
</style>
