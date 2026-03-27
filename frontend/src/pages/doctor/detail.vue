<script setup lang="ts">
import { onLoad, ref } from "vue";
import { apiGet, apiPatch } from "@/utils/api";

interface Chief {
  summary?: string;
  location?: string[];
  quality?: string;
  severity?: number | null;
  onset?: string;
}

interface Fam {
  relation: string;
  condition: string;
}

interface Chat {
  role: string;
  content: string;
}

interface Detail {
  patient_id: string;
  patient_name?: string;
  transcript?: string;
  past_medical_history?: string[];
  family_history?: Fam[];
  chief_complaint?: Chief | null;
  ai_conversation_log?: Chat[];
  doctor_notes?: string;
}

const id = ref("");
const row = ref<Detail | null>(null);
const notes = ref("");
const saving = ref(false);

onLoad((q) => {
  id.value = (q?.id as string) || "";
  load();
});

async function load() {
  if (!id.value) return;
  try {
    const d = await apiGet<Detail>(`/api/doctor/patients/${encodeURIComponent(id.value)}`);
    row.value = d;
    notes.value = d.doctor_notes || "";
  } catch {
    uni.showToast({ title: "加载失败", icon: "none" });
  }
}

async function saveNotes() {
  if (!id.value) return;
  saving.value = true;
  try {
    await apiPatch(`/api/doctor/patients/${encodeURIComponent(id.value)}/notes`, {
      doctor_notes: notes.value,
    });
    uni.showToast({ title: "已保存", icon: "success" });
  } catch {
    uni.showToast({ title: "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view v-if="row" class="page">
    <view class="card">
      <text class="h">患者</text>
      <text class="line">{{ row.patient_id }} · {{ row.patient_name || "匿名" }}</text>
    </view>

    <view class="card key">
      <text class="tag">结构化主诉（P0 卡片）</text>
      <text v-if="row.chief_complaint?.summary" class="big">{{ row.chief_complaint.summary }}</text>
      <view class="grid">
        <view class="cell">
          <text class="k">部位</text>
          <text class="v">{{ (row.chief_complaint?.location || []).join("、") || "—" }}</text>
        </view>
        <view class="cell">
          <text class="k">性质</text>
          <text class="v">{{ row.chief_complaint?.quality || "—" }}</text>
        </view>
        <view class="cell">
          <text class="k">程度</text>
          <text class="v">{{ row.chief_complaint?.severity ?? "—" }}</text>
        </view>
        <view class="cell">
          <text class="k">起病/时长</text>
          <text class="v">{{ row.chief_complaint?.onset || "—" }}</text>
        </view>
      </view>
      <text v-if="row.transcript" class="raw">原文：{{ row.transcript }}</text>
    </view>

    <view class="card">
      <text class="h">病史摘要</text>
      <text class="line">既往：{{ (row.past_medical_history || []).join("、") || "无" }}</text>
      <text class="line">家族：{{ (row.family_history || []).map((f) => `${f.relation}-${f.condition}`).join("；") || "无" }}</text>
    </view>

    <view class="card">
      <text class="h">AI 追问记录</text>
      <view v-for="(m, i) in row.ai_conversation_log || []" :key="i" class="log">
        <text class="who">{{ m.role === "ai" ? "助手" : "患者" }}</text>
        <text class="txt">{{ m.content }}</text>
      </view>
    </view>

    <view class="card">
      <text class="h">医生笔记</text>
      <textarea v-model="notes" class="area" placeholder="接诊记录、鉴别思路等" />
      <button class="btn" type="primary" :loading="saving" @click="saveNotes">保存笔记</button>
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
  margin-bottom: 16rpx;
  border: 1rpx solid #e2e8f0;
}
.card.key {
  border-color: #bfdbfe;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 40%);
}
.h {
  font-weight: 700;
  margin-bottom: 12rpx;
  display: block;
}
.tag {
  font-size: 22rpx;
  color: #1d4ed8;
  margin-bottom: 8rpx;
  display: block;
}
.big {
  font-size: 30rpx;
  line-height: 1.5;
  display: block;
  margin-bottom: 16rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.cell {
  width: 47%;
  background: #f8fafc;
  border-radius: 12rpx;
  padding: 12rpx 16rpx;
  box-sizing: border-box;
}
.k {
  font-size: 22rpx;
  color: #64748b;
  display: block;
}
.v {
  font-size: 26rpx;
  margin-top: 4rpx;
  display: block;
}
.raw {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.5;
  display: block;
}
.line {
  font-size: 26rpx;
  line-height: 1.6;
  display: block;
  color: #334155;
}
.log {
  margin-bottom: 12rpx;
  padding: 12rpx 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
}
.who {
  font-size: 22rpx;
  color: #64748b;
  display: block;
  margin-bottom: 4rpx;
}
.txt {
  font-size: 26rpx;
  line-height: 1.5;
}
.area {
  width: 100%;
  min-height: 160rpx;
  padding: 16rpx;
  box-sizing: border-box;
  border: 1rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.btn {
  margin-top: 16rpx;
  border-radius: 12rpx;
}
</style>
