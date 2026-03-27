<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import LangSwitcher from "@/components/LangSwitcher.vue";
import { getBodyLabel } from "@/locales/clinical";
import { apiGet, apiPatch } from "@/utils/api";
import { ensureDoctor } from "@/utils/auth";
import { useNavTitle } from "@/utils/useNavTitle";

const { t, locale } = useI18n();
useNavTitle("nav.doctorDetail");

interface Chief {
  summary?: string;
  location?: string[];
  quality?: string;
  severity?: number | null;
  onset?: string;
  aggravating?: string[];
  relieving?: string[];
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

onShow(() => {
  ensureDoctor();
});

function formatLocs(loc: string[] | undefined) {
  if (!loc?.length) return "—";
  return loc.map((x) => getBodyLabel(locale.value, x)).join(" · ");
}

async function load() {
  if (!id.value) return;
  try {
    const d = await apiGet<Detail>(`/api/doctor/patients/${encodeURIComponent(id.value)}`);
    row.value = d;
    notes.value = d.doctor_notes || "";
  } catch {
    uni.showToast({ title: t("doctor.detail.loadFail"), icon: "none" });
  }
}

async function saveNotes() {
  if (!id.value) return;
  saving.value = true;
  try {
    await apiPatch(`/api/doctor/patients/${encodeURIComponent(id.value)}/notes`, {
      doctor_notes: notes.value,
    });
    uni.showToast({ title: t("doctor.detail.saveOk"), icon: "success" });
  } catch {
    uni.showToast({ title: t("doctor.detail.saveFail"), icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view v-if="row" class="page sl-page">
    <view class="top-bar">
      <text class="lang-label">{{ t("lang.switch") }}</text>
      <LangSwitcher />
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("doctor.detail.patient") }}</text>
      <text class="line">{{ row.patient_id }} · {{ row.patient_name || t("doctor.detail.anon") }}</text>
    </view>

    <view class="sl-card key">
      <text class="tag">{{ t("doctor.detail.cc") }}</text>
      <text v-if="row.chief_complaint?.summary" class="big">{{ row.chief_complaint.summary }}</text>
      <view class="grid">
        <view class="cell">
          <text class="k">{{ t("doctor.detail.loc") }}</text>
          <text class="v">{{ formatLocs(row.chief_complaint?.location) }}</text>
        </view>
        <view class="cell">
          <text class="k">{{ t("doctor.detail.qual") }}</text>
          <text class="v">{{ row.chief_complaint?.quality || "—" }}</text>
        </view>
        <view class="cell">
          <text class="k">{{ t("doctor.detail.sev") }}</text>
          <text class="v">{{ row.chief_complaint?.severity ?? "—" }}</text>
        </view>
        <view class="cell">
          <text class="k">{{ t("doctor.detail.onset") }}</text>
          <text class="v">{{ row.chief_complaint?.onset || "—" }}</text>
        </view>
      </view>
      <text v-if="(row.chief_complaint?.aggravating || []).length" class="line sub">
        {{ t("doctor.detail.aggravate") }}：{{ (row.chief_complaint?.aggravating || []).join("、") }}
      </text>
      <text v-if="(row.chief_complaint?.relieving || []).length" class="line sub">
        {{ t("doctor.detail.relieving") }}：{{ (row.chief_complaint?.relieving || []).join("、") }}
      </text>
      <text v-if="row.transcript" class="raw">{{ t("doctor.detail.raw") }}：{{ row.transcript }}</text>
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("doctor.detail.hx") }}</text>
      <text class="line">{{ t("doctor.detail.past") }}：{{ (row.past_medical_history || []).join("、") || t("doctor.detail.none") }}</text>
      <text class="line">{{ t("doctor.detail.fam") }}：{{ (row.family_history || []).map((f) => `${f.relation}-${f.condition}`).join("；") || t("doctor.detail.none") }}</text>
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("doctor.detail.aiLog") }}</text>
      <view v-for="(m, i) in row.ai_conversation_log || []" :key="i" class="log">
        <text class="who">{{ m.role === "ai" ? t("doctor.detail.ai") : t("doctor.detail.pat") }}</text>
        <text class="txt">{{ m.content }}</text>
      </view>
    </view>

    <view class="sl-card">
      <text class="sl-h">{{ t("doctor.detail.notes") }}</text>
      <view class="field-wrap">
        <textarea v-model="notes" class="sl-textarea note" :placeholder="t('doctor.detail.notesPh')" />
      </view>
      <button class="sl-btn-primary" type="primary" :loading="saving" @click="saveNotes">{{ t("doctor.detail.save") }}</button>
    </view>
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

.key {
  border-color: rgba(167, 139, 250, 0.55) !important;
  background: linear-gradient(180deg, rgba(237, 233, 254, 0.95) 0%, rgba(255, 255, 255, 0.55) 45%) !important;
}
.tag {
  font-size: 22rpx;
  color: #6d28d9;
  margin-bottom: 8rpx;
  display: block;
  font-weight: 600;
}
.big {
  font-size: 30rpx;
  line-height: 1.5;
  display: block;
  margin-bottom: 16rpx;
  color: #312e81;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.cell {
  width: 47%;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 16rpx;
  padding: 12rpx 16rpx;
  box-sizing: border-box;
  border: 2rpx solid rgba(167, 139, 250, 0.25);
}
.k {
  font-size: 22rpx;
  color: #6b21a8;
  display: block;
}
.v {
  font-size: 26rpx;
  margin-top: 4rpx;
  display: block;
  color: #312e81;
}
.raw {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #5b21b6;
  line-height: 1.5;
  display: block;
  opacity: 0.88;
}
.line {
  font-size: 26rpx;
  line-height: 1.6;
  display: block;
  color: #312e81;
}
.line.sub {
  margin-top: 10rpx;
  font-size: 24rpx;
  opacity: 0.92;
}
.log {
  margin-bottom: 12rpx;
  padding: 12rpx 16rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16rpx;
  border: 2rpx solid rgba(167, 139, 250, 0.2);
}
.who {
  font-size: 22rpx;
  color: #7c3aed;
  display: block;
  margin-bottom: 4rpx;
}
.txt {
  font-size: 26rpx;
  line-height: 1.5;
  color: #312e81;
}
.note {
  min-height: 160rpx;
}
</style>
