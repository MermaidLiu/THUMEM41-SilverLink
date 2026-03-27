<script setup lang="ts">
import { computed, ref } from "vue";
import { apiPost } from "@/utils/api";
import type { IntakeDraft } from "@/utils/intake";
import { clearDraft, loadDraft, saveDraft } from "@/utils/intake";

const draft = ref<IntakeDraft>(loadDraft());
const submitting = ref(false);

function persist() {
  saveDraft(draft.value);
}

const readBack = computed(() => {
  if (draft.value.read_back_text.trim()) return draft.value.read_back_text;
  const t = draft.value.transcript.trim();
  const locs = draft.value.pain_locations
    .map((p) => `${p.body_part} ${p.severity}/10（${p.pain_type}）`)
    .join("；");
  const past = draft.value.past_medical_history.join("、") || "未勾选";
  const fam =
    draft.value.family_history.map((f) => `${f.relation}${f.condition}`).join("；") || "未填写";
  return `我们理解您的主要描述为：${t || "（未填写文字）"}。标注部位：${locs || "无"}。既往病史：${past}。家族史：${fam}。以上信息将交给医生参考，不作为诊断结论。`;
});

function syncReadBack() {
  draft.value.read_back_text = readBack.value;
  persist();
}

async function submit() {
  syncReadBack();
  submitting.value = true;
  try {
    const body = {
      patient_name: draft.value.patient_name,
      language: draft.value.language,
      transcript: draft.value.transcript,
      pain_locations: draft.value.pain_locations,
      ai_conversation_log: draft.value.ai_conversation_log,
      past_medical_history: draft.value.past_medical_history,
      family_history: draft.value.family_history,
      read_back_text: draft.value.read_back_text,
    };
    const res = await apiPost<{ patient_id: string }>("/api/intake/submit", body);
    clearDraft();
    uni.showModal({
      title: "已提交",
      content: `登记号：${res.patient_id}，医生端可查看结构化摘要。`,
      showCancel: false,
      success: () => {
        uni.reLaunch({ url: "/pages/index/index" });
      },
    });
  } catch {
    uni.showToast({ title: "提交失败，请检查网络与接口", icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="page">
    <view class="card">
      <text class="h">患者信息（可编辑）</text>
      <input v-model="draft.patient_name" class="input" placeholder="姓名 / 称呼（可选）" @blur="persist" />
    </view>

    <view class="card">
      <text class="h">AI 理解回读（P0：规则生成，可改）</text>
      <textarea v-model="draft.read_back_text" class="area" :placeholder="readBack" @blur="persist" />
      <button class="btn sm plain" @click="syncReadBack">用系统自动摘要填充</button>
    </view>

    <button class="btn primary" type="primary" :loading="submitting" @click="submit">确认提交</button>
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
.input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 12rpx;
  box-sizing: border-box;
  font-size: 28rpx;
}
.area {
  width: 100%;
  min-height: 240rpx;
  padding: 16rpx;
  box-sizing: border-box;
  border: 1rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 26rpx;
  line-height: 1.5;
}
.btn {
  margin-top: 16rpx;
  border-radius: 16rpx;
}
.btn.sm {
  font-size: 26rpx;
}
.btn.plain {
  background: #eff6ff;
  color: #1d4ed8;
  border: none;
}
</style>
