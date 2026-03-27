<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  selectedKeys: string[];
  colorForIndex: (i: number) => string;
  hintText?: string;
  /** 与 BodyModel3D 圆形舞台一致，铺满父级正方形 */
  embedOrb?: boolean;
}>();

const emit = defineEmits<{
  (e: "tap", part: string): void;
}>();

type Zone = { part: string; top: string; left: string; width: string; height: string };

const zones: Zone[] = [
  { part: "head", top: "2%", left: "38%", width: "24%", height: "14%" },
  { part: "left_shoulder", top: "18%", left: "18%", width: "22%", height: "12%" },
  { part: "right_shoulder", top: "18%", left: "60%", width: "22%", height: "12%" },
  { part: "chest", top: "22%", left: "32%", width: "36%", height: "18%" },
  { part: "abdomen", top: "40%", left: "34%", width: "32%", height: "16%" },
  { part: "lower_back", top: "38%", left: "10%", width: "22%", height: "20%" },
  { part: "lower_back", top: "38%", left: "68%", width: "22%", height: "20%" },
  { part: "left_knee", top: "62%", left: "22%", width: "18%", height: "16%" },
  { part: "right_knee", top: "62%", left: "60%", width: "18%", height: "16%" },
  { part: "left_ankle", top: "82%", left: "24%", width: "16%", height: "12%" },
  { part: "right_ankle", top: "82%", left: "60%", width: "16%", height: "12%" },
];

const indexByPart = computed(() => {
  const m = new Map<string, number>();
  props.selectedKeys.forEach((p, i) => m.set(p, i));
  return m;
});

function onZone(part: string) {
  emit("tap", part);
}
</script>

<template>
  <view class="wrap" :class="{ orb: props.embedOrb }">
    <view class="silhouette" :class="{ 'figure-rich': props.embedOrb }">
      <view v-if="props.embedOrb" class="arm arm-l" />
      <view v-if="props.embedOrb" class="arm arm-r" />
      <view class="head-circle" />
      <view class="torso" :class="{ 'torso-orb': props.embedOrb }" />
      <view v-if="props.embedOrb" class="leg leg-l" />
      <view v-if="props.embedOrb" class="leg leg-r" />
      <view
        v-for="(z, idx) in zones"
        :key="`${z.part}-${idx}`"
        class="zone"
        :style="{
          top: z.top,
          left: z.left,
          width: z.width,
          height: z.height,
          borderColor:
            indexByPart.get(z.part) !== undefined
              ? colorForIndex(indexByPart.get(z.part) as number)
              : 'rgba(124, 58, 237, 0.5)',
        }"
        @tap="onZone(z.part)"
      />
    </view>
    <text v-if="props.hintText" class="hint">{{ props.hintText }}</text>
  </view>
</template>

<style lang="scss" scoped>
.wrap {
  margin-top: 12px;
}
.silhouette {
  position: relative;
  width: 100%;
  height: 360rpx;
  border-radius: 16rpx;
  background: linear-gradient(180deg, #e2e8f0 0%, #f8fafc 100%);
  overflow: hidden;
}
.torso {
  position: absolute;
  left: 50%;
  top: 18%;
  width: 42%;
  height: 70%;
  transform: translateX(-50%);
  background: #cbd5e1;
  border-radius: 40% 40% 45% 45%;
  z-index: 1;
}
.torso.torso-orb {
  height: 52%;
  background: linear-gradient(180deg, #c4b5fd 0%, #a78bfa 55%, #8b5cf6 100%);
  border-radius: 42% 42% 40% 40%;
  box-shadow: inset 0 -4rpx 0 rgba(255, 255, 255, 0.2);
}
.head-circle {
  position: absolute;
  left: 50%;
  top: 4%;
  width: 22%;
  height: 18%;
  transform: translateX(-50%);
  background: #94a3b8;
  border-radius: 50%;
  z-index: 2;
}
.figure-rich .head-circle {
  width: 24%;
  height: 17%;
  background: linear-gradient(165deg, #ddd6fe 0%, #a78bfa 100%);
  box-shadow: 0 4rpx 12rpx rgba(91, 33, 182, 0.15);
}
.arm {
  position: absolute;
  width: 14%;
  background: linear-gradient(90deg, #a78bfa, #c4b5fd);
  border-radius: 999rpx;
  z-index: 0;
}
.arm-l {
  left: 22%;
  top: 20%;
  height: 36%;
  transform: rotate(12deg);
}
.arm-r {
  left: 64%;
  top: 20%;
  height: 36%;
  transform: rotate(-12deg);
}
.leg {
  position: absolute;
  top: 64%;
  width: 16%;
  height: 30%;
  background: linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%);
  border-radius: 40% 40% 45% 45%;
  z-index: 0;
}
.leg-l {
  left: 36%;
  transform: translateX(-50%);
}
.leg-r {
  left: 64%;
  transform: translateX(-50%);
}
.figure-rich .torso {
  box-shadow:
    inset 0 -6rpx 0 rgba(255, 255, 255, 0.25),
    0 8rpx 20rpx rgba(124, 58, 237, 0.2);
}
.figure-rich .zone {
  z-index: 3;
  background: rgba(255, 255, 255, 0.06);
}
.zone {
  position: absolute;
  z-index: 5;
  border: 2rpx dashed rgba(124, 58, 237, 0.45);
  border-radius: 12rpx;
  box-sizing: border-box;
}
.wrap.orb {
  margin-top: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.wrap.orb .silhouette {
  flex: 1;
  min-height: 380rpx;
  height: 100%;
  border-radius: 0;
  background: radial-gradient(ellipse 70% 55% at 50% 38%, rgba(237, 233, 254, 0.95) 0%, rgba(221, 214, 254, 0.75) 45%, rgba(196, 181, 253, 0.5) 100%);
}
.wrap.orb .hint {
  flex-shrink: 0;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #6b21a8;
  line-height: 1.5;
}
</style>
