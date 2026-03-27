<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import LangSwitcher from "@/components/LangSwitcher.vue";
import { apiPost } from "@/utils/api";
import { ensurePatient } from "@/utils/auth";
import type { IntakeDraft } from "@/utils/intake";
import { clearDraft, loadDraft, saveDraft } from "@/utils/intake";
import { useNavTitle } from "@/utils/useNavTitle";

const { t } = useI18n();
useNavTitle("nav.confirm");

const draft = ref<IntakeDraft>(loadDraft());
const submitting = ref(false);

onShow(() => {
  ensurePatient();
});

function persist() {
  saveDraft(draft.value);
}

const readBack = computed(() => {
  if (draft.value.read_back_text.trim()) return draft.value.read_back_text;
  const t0 = draft.value.transcript.trim();
  const locs = draft.value.pain_locations
    .map((p) => `${p.body_part} ${p.severity}/10 (${p.pain_type})`)
    .join("; ");
  const past = draft.value.past_medical_history.join(", ") || "—";
  const fam =
    draft.value.family_history.map((f) => `${f.relation}: ${f.condition}`).join("; ") || "—";
  return `[Auto] Chief: ${t0 || "—"}. Sites: ${locs || "—"}. PMH: ${past}. FH: ${fam}. Not a diagnosis.`;
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
      title: t("patient.confirm.okTitle"),
      content: t("patient.confirm.okContent", { id: res.patient_id }),
      showCancel: false,
      success: () => {
        uni.reLaunch({ url: "/pages/patient/home" });
      },
    });
  } catch {
    uni.showToast({ title: t("patient.confirm.fail"), icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="page sl-page">
    <view class="top-bar">
      <text class="lang-label">{{ t("lang.switch") }}</text>
      <LangSwitcher />
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("patient.confirm.infoTitle") }}</text>
      <view class="field-wrap">
        <input v-model="draft.patient_name" class="sl-input-inner" :placeholder="t('patient.confirm.namePh')" @blur="persist" />
      </view>
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("patient.confirm.readTitle") }}</text>
      <view class="field-wrap">
        <textarea v-model="draft.read_back_text" class="sl-textarea tall" :placeholder="readBack" @blur="persist" />
      </view>
      <button class="btn-soft" @click="syncReadBack">{{ t("patient.confirm.fillBtn") }}</button>
    </view>

    <button class="sl-btn-primary" type="primary" :loading="submitting" @click="submit">{{ t("patient.confirm.submit") }}</button>
  </view>
</template>

<style lang="scss" scoped>
@import "@/uni.scss";

.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.lang-label {
  font-size: 24rpx;
  color: #6b21a8;
  opacity: 0.85;
}
.field-wrap {
  width: 100%;
  display: block;
  box-sizing: border-box;
}
.tall {
  min-height: 240rpx;
  line-height: 1.55;
}
.btn-soft {
  margin-top: 16rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  background: rgba(167, 139, 250, 0.35);
  color: #5b21b6;
  border: 2rpx solid rgba(124, 58, 237, 0.25);
}
</style>
