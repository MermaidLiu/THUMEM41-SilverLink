<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
// #ifndef MP-WEIXIN
import BodyModel3D from "@/components/BodyModel3D.vue";
// #endif
import BodyTapMap from "@/components/BodyTapMap.vue";
import LangSwitcher from "@/components/LangSwitcher.vue";
import { getBodyLabel } from "@/locales/clinical";
import { apiPost } from "@/utils/api";
import { ensurePatient } from "@/utils/auth";
import type { IntakeDraft, PainLocation } from "@/utils/intake";
import { loadDraft, saveDraft } from "@/utils/intake";
import { localFollowUpMessageKey, shouldOpenBodyModelLocal } from "@/utils/localFollowup";
import { refineLastPainFromSpeech } from "@/utils/voicePainParse";
import { useNavTitle } from "@/utils/useNavTitle";

const { t, locale } = useI18n();
useNavTitle("nav.symptom");

const draft = ref<IntakeDraft>(loadDraft());
if (draft.value.ai_conversation_log.length === 0) {
  draft.value.ai_conversation_log.push({ role: "ai", content: t("patient.symptom.voiceWelcome") });
  saveDraft(draft.value);
}

const loadingAsr = ref(false);
const loadingAi = ref(false);
const palette = ["#ef4444", "#f97316", "#ca8a04", "#16a34a", "#7c3aed"];
const use2dFallback = ref(false);
const bodyGuideOpen = ref(false);
/** 每次打开身图弹层递增，强制重建 WebGL canvas（小程序弹层内常见 0 尺寸问题） */
const bodyModelEpoch = ref(0);
const scrollIntoId = ref("");

const bodyOrbPx = computed(() => {
  try {
    const sys = uni.getSystemInfoSync();
    const ww = sys.windowWidth || 375;
    const sideRpx = 480;
    return Math.max(200, Math.floor(Math.min(ww * 0.72, uni.upx2px(sideRpx))));
  } catch {
    return 300;
  }
});

function openBodyGuide() {
  bodyModelEpoch.value += 1;
  bodyGuideOpen.value = true;
}
const simOverlayOpen = ref(false);
const simText = ref("");
/** 长按打开测试面板后，部分平台仍会触发一次 click，需忽略 */
let ignoreMicClickUntil = 0;
let devHintTapAt = 0;

function onDevHintTap() {
  const now = Date.now();
  if (now - devHintTapAt < 450) {
    devHintTapAt = 0;
    if (!loadingAsr.value && !loadingAi.value && !bodyGuideOpen.value) {
      openSimEditor();
    }
    return;
  }
  devHintTapAt = now;
}

const markers3d = computed(() =>
  draft.value.pain_locations.map((p, i) => ({
    part: p.body_part,
    color: colorForIndex(i),
  }))
);
const selectedKeys = computed(() => draft.value.pain_locations.map((p) => p.body_part));

onShow(() => {
  ensurePatient();
});

function persist() {
  saveDraft(draft.value);
}

function colorForIndex(i: number) {
  return palette[i % palette.length];
}

function partLabel(id: string) {
  return getBodyLabel(locale.value, id);
}

function scrollChatToEnd() {
  nextTick(() => {
    scrollIntoId.value = "";
    nextTick(() => {
      scrollIntoId.value = "chat-end";
    });
  });
}

function existingSymptomsSummary() {
  const parts = draft.value.pain_locations
    .map((p) => `${p.body_part} ${p.severity}/10 ${p.pain_type}`)
    .join("；");
  return parts || "—";
}

function onBodyPartTapped(part: string) {
  const existing = draft.value.pain_locations.find((p) => p.body_part === part);
  const next: PainLocation = existing
    ? { ...existing }
    : { body_part: part, pain_type: "dull", severity: 5, duration: "" };
  const idx = draft.value.pain_locations.findIndex((p) => p.body_part === part);
  if (idx >= 0) draft.value.pain_locations.splice(idx, 1, next);
  else draft.value.pain_locations.push(next);
  bodyGuideOpen.value = false;
  draft.value.ai_conversation_log.push({
    role: "ai",
    content: t("patient.symptom.bodySavedVoice", { part: partLabel(part) }),
  });
  persist();
  scrollChatToEnd();
}

async function consumeUserText(text: string) {
  draft.value.transcript = text;
  draft.value.ai_conversation_log.push({ role: "patient", content: text });

  const last = draft.value.pain_locations[draft.value.pain_locations.length - 1];
  if (last) {
    const refined = refineLastPainFromSpeech(last, text);
    const idx = draft.value.pain_locations.length - 1;
    draft.value.pain_locations.splice(idx, 1, refined);
  }
  persist();
  scrollChatToEnd();
}

async function runFollowUp() {
  loadingAi.value = true;
  try {
    const userInput = draft.value.transcript.trim();
    const es = existingSymptomsSummary();
    const log = draft.value.ai_conversation_log;

    let openBody = false;
    let aiText: string;

    try {
      const r2 = await apiPost<{ question: string; open_body_model?: boolean }>("/api/ai/follow-up", {
        user_input: userInput,
        existing_symptoms: es,
        conversation_log: log,
      });
      openBody = !!r2.open_body_model;
      aiText = openBody ? t("patient.symptom.bodyVoicePrompt") : r2.question;
    } catch {
      /** 小程序连不上后端时，用与后端一致的规则本地生成追问，并可触发身图 */
      openBody = shouldOpenBodyModelLocal(es, userInput, log);
      const key = localFollowUpMessageKey(userInput, es);
      aiText = openBody ? t("patient.symptom.bodyVoicePrompt") : t(`patient.symptom.${key}`);
    }

    draft.value.ai_conversation_log.push({ role: "ai", content: aiText });
    if (openBody) openBodyGuide();
    persist();
    scrollChatToEnd();
  } finally {
    loadingAi.value = false;
  }
}

/** 菜单 / 测试：直接走「助手说明 + 弹 3D 身图」完整引导，不依赖追问接口 */
function demoBodyGuideFlow() {
  if (loadingAi.value || loadingAsr.value) return;
  draft.value.ai_conversation_log.push({
    role: "ai",
    content: t("patient.symptom.bodyVoicePrompt"),
  });
  openBodyGuide();
  persist();
  scrollChatToEnd();
}

function applyDemoBodyOnly() {
  simOverlayOpen.value = false;
  demoBodyGuideFlow();
}

async function voiceTurn() {
  if (loadingAsr.value || loadingAi.value) return;
  if (bodyGuideOpen.value) {
    uni.showToast({ title: t("patient.symptom.bodyOverlayLine"), icon: "none" });
    return;
  }

  loadingAsr.value = true;
  try {
    const r = await apiPost<{ text: string }>("/api/asr/transcribe", {
      simulated_text: "",
    });
    await consumeUserText(r.text);
  } catch {
    uni.showToast({ title: t("patient.symptom.toastAsrFail"), icon: "none" });
    loadingAsr.value = false;
    return;
  } finally {
    loadingAsr.value = false;
  }

  await runFollowUp();
}

function openSimEditor() {
  if (!simText.value.trim()) {
    simText.value = t("patient.symptom.devSimExample");
  }
  simOverlayOpen.value = true;
}

function onMicLongPress() {
  if (loadingAsr.value || loadingAi.value) return;
  if (bodyGuideOpen.value) return;
  ignoreMicClickUntil = Date.now() + 650;
  openSimEditor();
}

function onMicClick() {
  if (Date.now() < ignoreMicClickUntil) return;
  void voiceTurn();
}

/** 测试面板：不请求 ASR 接口（小程序常访问不到本机后端），直接把输入当作识别结果 */
async function applySimulatedVoice() {
  const raw = simText.value.trim();
  if (!raw) {
    uni.showToast({ title: t("patient.symptom.devSimEmpty"), icon: "none" });
    return;
  }
  if (loadingAi.value) return;
  simOverlayOpen.value = false;

  await consumeUserText(raw);
  await runFollowUp();
}

function closeSimEditor() {
  simOverlayOpen.value = false;
}

function goHistory() {
  persist();
  uni.navigateTo({ url: "/pages/patient/history" });
}

function showMenu() {
  uni.showActionSheet({
    itemList: [
      t("patient.symptom.menuNext"),
      t("patient.symptom.menuSkipBody"),
      t("patient.symptom.devSimOpen"),
      t("patient.symptom.menuDemoBody"),
      t("patient.symptom.menuClear"),
    ],
    success(res) {
      if (res.tapIndex === 0) {
        goHistory();
      } else if (res.tapIndex === 1) {
        bodyGuideOpen.value = false;
      } else if (res.tapIndex === 2) {
        openSimEditor();
      } else if (res.tapIndex === 3) {
        demoBodyGuideFlow();
      } else if (res.tapIndex === 4) {
        uni.showModal({
          title: t("patient.symptom.clearSessionTitle"),
          content: t("patient.symptom.menuClearContent"),
          success(r) {
            if (!r.confirm) return;
            draft.value.transcript = "";
            draft.value.pain_locations = [];
            draft.value.ai_conversation_log = [{ role: "ai", content: t("patient.symptom.voiceWelcome") }];
            bodyGuideOpen.value = false;
            persist();
            scrollChatToEnd();
          },
        });
      }
    },
  });
}

function on3dFail() {
  use2dFallback.value = true;
  uni.showToast({ title: t("patient.symptom.toast2d"), icon: "none" });
}
</script>

<template>
  <view class="page voice-page">
    <view class="top-row">
      <text class="menu-hit" @click="showMenu">⋯</text>
      <LangSwitcher />
    </view>

    <scroll-view
      scroll-y
      class="chat-scroll"
      :scroll-into-view="scrollIntoId"
      scroll-with-animation
      :show-scrollbar="false"
    >
      <view class="chat-inner">
        <view
          v-for="(m, idx) in draft.ai_conversation_log"
          :key="idx"
          :class="['bubble-row', m.role === 'ai' ? 'is-ai' : 'is-me']"
        >
          <view :class="['bubble', m.role === 'ai' ? 'b-ai' : 'b-me']">
            <text class="bubble-txt">{{ m.content }}</text>
          </view>
        </view>
        <view id="chat-end" class="chat-end-spacer" />
      </view>
    </scroll-view>

    <view class="bottom-zone">
      <text v-if="loadingAsr" class="state-hint">{{ t("patient.symptom.listeningHint") }}</text>
      <text v-else-if="loadingAi" class="state-hint">{{ t("patient.symptom.thinkingHint") }}</text>
      <text v-else class="state-hint dim">{{ t("patient.symptom.voiceTapHint") }}</text>

      <view class="done-strip" @click="goHistory">
        <text class="done-line">{{ t("patient.symptom.whenDoneLine") }}</text>
        <text class="done-cta">{{ t("patient.symptom.whenDoneCta") }}</text>
      </view>

      <view
        class="mic-big"
        :class="{ busy: loadingAsr || loadingAi }"
        @click="onMicClick"
        @longpress="onMicLongPress"
      >
        <text class="mic-emoji">🎤</text>
      </view>

      <text class="dev-hint" @click="onDevHintTap">{{ t("patient.symptom.devSimHint") }}</text>
      <text class="ai-foot">{{ t("patient.symptom.aiDisclaimer") }}</text>
    </view>

    <!-- 仅在需要定位时弹出；点选部位即保存，细节靠后续语音补充 -->
    <view v-if="bodyGuideOpen" class="body-overlay">
      <view class="body-sheet">
        <text class="body-line">{{ t("patient.symptom.bodyOverlayLine") }}</text>
        <!-- #ifndef MP-WEIXIN -->
        <text class="body-drag-hint">{{ t("patient.symptom.body3dDragHint") }}</text>
        <!-- #endif -->
        <view class="orb-ring">
          <view class="orb-disk">
            <!-- 微信小程序 WebGL/Three 常无法可靠绘制，弹层内统一用可点选的人形示意图 -->
            <!-- #ifdef MP-WEIXIN -->
            <BodyTapMap
              embed-orb
              :selected-keys="selectedKeys"
              :color-for-index="colorForIndex"
              :hint-text="''"
              @tap="onBodyPartTapped"
            />
            <!-- #endif -->
            <!-- #ifndef MP-WEIXIN -->
            <BodyModel3D
              v-if="!use2dFallback"
              :key="'bd-' + bodyModelEpoch"
              variant="orb"
              :orb-canvas-px="bodyOrbPx"
              :mp-canvas-suffix="bodyModelEpoch"
              :markers="markers3d"
              @select="onBodyPartTapped"
              @fail="on3dFail"
            />
            <BodyTapMap
              v-else
              embed-orb
              :selected-keys="selectedKeys"
              :color-for-index="colorForIndex"
              :hint-text="''"
              @tap="onBodyPartTapped"
            />
            <!-- #endif -->
          </view>
        </view>
        <text class="body-tip">{{ t("patient.symptom.bodyVoicePrompt") }}</text>
      </view>
    </view>

    <!-- 测试：文字当作 ASR 结果 -->
    <view v-if="simOverlayOpen" class="sim-overlay" @click.self="closeSimEditor">
      <view class="sim-sheet" @click.stop>
        <text class="sim-title">{{ t("patient.symptom.devSimTitle") }}</text>
        <textarea
          v-model="simText"
          class="sim-ta"
          :placeholder="t('patient.symptom.devSimPh')"
        />
        <view class="sim-row">
          <button class="sim-btn ghost" type="default" @click="closeSimEditor">
            {{ t("patient.symptom.devSimCancel") }}
          </button>
          <button class="sim-btn primary" type="primary" @click="applySimulatedVoice">
            {{ t("patient.symptom.devSimApply") }}
          </button>
        </view>
        <text class="sim-demo-only" @click="applyDemoBodyOnly">{{ t("patient.symptom.devSimBodyDemo") }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.voice-page {
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 20rpx 24rpx 0;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: linear-gradient(165deg, #fae8ff 0%, #e9d5ff 40%, #ddd6fe 75%, #ede9fe 100%);
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 16rpx;
  padding: 0 4rpx;
}
.menu-hit {
  font-size: 44rpx;
  color: #6b21a8;
  opacity: 0.5;
  padding: 8rpx 16rpx 8rpx 0;
}

.chat-scroll {
  flex: 1;
  min-height: 200rpx;
  max-height: 68vh;
  padding-bottom: 12rpx;
}
.chat-inner {
  display: flex;
  flex-direction: column;
  padding: 4rpx 0 12rpx;
}
.bubble-row {
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 16rpx;
}
.bubble-row.is-ai {
  justify-content: flex-start;
}
.bubble-row.is-me {
  justify-content: flex-end;
}
.bubble {
  max-width: 88%;
  padding: 20rpx 22rpx;
  border-radius: 22rpx;
  line-height: 1.55;
}
.b-ai {
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 6rpx 20rpx rgba(124, 58, 237, 0.08);
}
.b-me {
  background: rgba(124, 58, 237, 0.22);
  border: 2rpx solid rgba(124, 58, 237, 0.35);
}
.bubble-txt {
  font-size: 28rpx;
  color: #312e81;
  white-space: pre-wrap;
  word-break: break-word;
}

.done-strip {
  width: 100%;
  max-width: 620rpx;
  margin-top: 8rpx;
  margin-bottom: 8rpx;
  padding: 18rpx 22rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.55);
  border: 2rpx solid rgba(124, 58, 237, 0.28);
  box-sizing: border-box;
}
.done-line {
  display: block;
  font-size: 24rpx;
  color: #6b21a8;
  margin-bottom: 8rpx;
  text-align: center;
}
.done-cta {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #5b21b6;
  text-align: center;
}

.chat-end-spacer {
  height: 24rpx;
}

.bottom-zone {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8rpx;
  padding-bottom: 8rpx;
}
.state-hint {
  font-size: 26rpx;
  color: #5b21b6;
  margin-bottom: 16rpx;
  min-height: 40rpx;
  text-align: center;
}
.state-hint.dim {
  opacity: 0.75;
}

.mic-big {
  width: 144rpx;
  height: 144rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.85) 0%, rgba(237, 233, 254, 0.9) 100%);
  border: 3rpx solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 16rpx 40rpx rgba(124, 58, 237, 0.25);
}
.mic-big.busy {
  opacity: 0.65;
  pointer-events: none;
}
.mic-emoji {
  font-size: 64rpx;
}

.dev-hint {
  margin-top: 12rpx;
  padding: 12rpx 32rpx;
  font-size: 22rpx;
  color: #6b21a8;
  opacity: 0.55;
  text-align: center;
  line-height: 1.45;
}
.ai-foot {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #7c3aed;
  opacity: 0.5;
  text-align: center;
}

.sim-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 500;
  background: rgba(30, 27, 75, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 28rpx;
  box-sizing: border-box;
}
.sim-sheet {
  width: 100%;
  max-width: 620rpx;
  padding: 28rpx 24rpx 32rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.97);
  border: 2rpx solid rgba(255, 255, 255, 1);
  box-sizing: border-box;
}
.sim-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #4c1d95;
  margin-bottom: 20rpx;
  text-align: center;
}
.sim-ta {
  width: 100%;
  box-sizing: border-box;
  min-height: 160rpx;
  padding: 20rpx 22rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.5;
  color: #312e81;
  background: rgba(245, 243, 255, 0.9);
  border: 2rpx solid rgba(167, 139, 250, 0.35);
  margin-bottom: 24rpx;
}
.sim-row {
  display: flex;
  gap: 16rpx;
}
.sim-btn {
  flex: 1;
  border-radius: 18rpx;
  font-size: 28rpx;
}
.sim-btn.ghost {
  background: rgba(255, 255, 255, 0.8);
  color: #5b21b6;
}
.sim-btn.primary {
  font-weight: 600;
}
.sim-demo-only {
  display: block;
  margin-top: 20rpx;
  text-align: center;
  font-size: 24rpx;
  color: #7c3aed;
  text-decoration: underline;
  padding: 12rpx 0;
}

.body-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 400;
  background: rgba(30, 27, 75, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}
.body-sheet {
  width: 100%;
  max-width: 640rpx;
  padding: 28rpx 24rpx 32rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 2rpx solid rgba(255, 255, 255, 0.98);
  box-sizing: border-box;
}
.body-line {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #4c1d95;
  text-align: center;
  margin-bottom: 16rpx;
}
.body-drag-hint {
  display: block;
  font-size: 24rpx;
  color: #6b21a8;
  text-align: center;
  line-height: 1.45;
  margin-bottom: 12rpx;
  opacity: 0.9;
}
.body-tip {
  display: block;
  font-size: 24rpx;
  color: #6b21a8;
  line-height: 1.5;
  margin-top: 20rpx;
  text-align: center;
  opacity: 0.92;
}

.orb-ring {
  padding: 4rpx;
  border-radius: 50%;
  margin: 0 auto;
  width: 480rpx;
  max-width: 72vw;
  box-sizing: border-box;
  background: linear-gradient(
    140deg,
    rgba(167, 139, 250, 0.5) 0%,
    rgba(196, 181, 253, 0.35) 50%,
    rgba(125, 211, 252, 0.38) 100%
  );
  box-shadow: 0 16rpx 40rpx rgba(91, 33, 182, 0.12);
}
.orb-disk {
  position: relative;
  width: 480rpx;
  height: 480rpx;
  max-width: 72vw;
  max-height: 72vw;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(180deg, #faf5ff 0%, #f5f3ff 45%, #ede9fe 100%);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
}
</style>
