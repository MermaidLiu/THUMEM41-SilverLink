<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  selectedKeys: string[];
  colorForIndex: (i: number) => string;
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
  <view class="wrap">
    <view class="silhouette">
      <view class="torso" />
      <view class="head-circle" />
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
              : 'rgba(37,99,235,0.35)',
        }"
        @click="onZone(z.part)"
      />
    </view>
    <text class="hint">点击轮廓对应区域可添加或编辑该部位标注（P0 示意，可替换为 GLB）</text>
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
}
.zone {
  position: absolute;
  border: 2rpx dashed rgba(37, 99, 235, 0.5);
  border-radius: 12rpx;
  box-sizing: border-box;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.5;
}
</style>
