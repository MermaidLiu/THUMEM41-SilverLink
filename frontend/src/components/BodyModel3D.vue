<script setup lang="ts">
// #ifdef MP-WEIXIN
import { createScopedThreejs } from "threejs-miniprogram";
// #endif
import { computed, getCurrentInstance, onMounted, onUnmounted, watch, nextTick, ref } from "vue";
import { applyMarkerColors, buildBodyAvatar, type BodyMesh } from "@/utils/bodyAvatar3d";

const props = defineProps<{
  markers: { part: string; color: string }[];
  hintText?: string;
  /** 圆形舞台内铺满（父容器需为固定正方形并 overflow:hidden） */
  variant?: "default" | "orb";
  /** 小程序弹层内必传：圆形区边长（px），避免 canvas 量到 0×0 只有空白 */
  orbCanvasPx?: number;
  /** 小程序 canvas-id 后缀，每次弹层打开换一个，避免上下文残留 */
  mpCanvasSuffix?: number | string;
}>();

const emit = defineEmits<{
  (e: "select", part: string): void;
  (e: "fail"): void;
}>();

/** 必须在 setup 同步读取；异步回调里 getCurrentInstance() 为 null，会导致 .in(undefined) → $scope 报错 */
const mpComponentProxy = getCurrentInstance()?.proxy as any;

const h5CanvasRef = ref<HTMLCanvasElement | null>(null);
let h5ResizeListener: (() => void) | null = null;

const mpCanvasIdStr = computed(
  () => `slbodygl${props.mpCanvasSuffix !== undefined && props.mpCanvasSuffix !== "" ? props.mpCanvasSuffix : ""}`
);

const mpOrbInlineStyle = computed(() => {
  if ((props.variant ?? "default") !== "orb") return "";
  const px = props.orbCanvasPx;
  if (px && px > 0) return `width:${px}px;height:${px}px;`;
  return "";
});

let disposed = false;
let rafId = 0;
let scene: any;
let camera: any;
let renderer: any;
let raycaster: any;
let THREE_NS: any;
let bodyEntries: BodyMesh[] = [];
let canvasEl: any = null;
let orbitAngle = 0.9;
let dragging = false;
let lastX = 0;
let moved = false;
let mpInitAttempts = 0;

function syncColors() {
  if (!THREE_NS || !bodyEntries.length) return;
  applyMarkerColors(THREE_NS, bodyEntries, props.markers);
}

watch(
  () => props.markers,
  () => syncColors(),
  { deep: true }
);

function pick(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }) {
  if (!raycaster || !camera || !THREE_NS) return;
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(new THREE_NS.Vector2(x, y), camera);
  const objs = bodyEntries.map((e) => e.mesh);
  const hits = raycaster.intersectObjects(objs, false);
  const part = hits[0]?.object?.userData?.bodyPart as string | undefined;
  if (part) emit("select", part);
}

// #ifdef MP-WEIXIN
function loopMp() {
  if (disposed || !renderer || !scene || !camera || !canvasEl) return;
  if (typeof canvasEl.requestAnimationFrame === "function") {
    rafId = canvasEl.requestAnimationFrame(loopMp);
  }
  renderer.render(scene, camera);
}

function initMp() {
  const q = mpComponentProxy
    ? uni.createSelectorQuery().in(mpComponentProxy)
    : uni.createSelectorQuery();
  q.select("#sl-body-gl")
    .fields({ node: true, size: true })
    .exec((res: any[]) => {
      try {
        const node = res[0]?.node;
        let w = Number(res[0]?.width) || 0;
        let h = Number(res[0]?.height) || 0;
        const isOrb = (props.variant ?? "default") === "orb";
        const forced = props.orbCanvasPx;
        if (isOrb && forced && forced > 0) {
          w = forced;
          h = forced;
        }
        if ((!w || !h) && mpInitAttempts < 25) {
          mpInitAttempts += 1;
          setTimeout(() => initMp(), 140);
          return;
        }
        if (!node) {
          emit("fail");
          return;
        }
        if (!w || !h) {
          w = forced && forced > 0 ? forced : 300;
          h = forced && forced > 0 ? forced : 400;
        }
        canvasEl = node;
        const sys = uni.getSystemInfoSync();
        const dpr = sys.pixelRatio || 1;
        node.width = w * dpr;
        node.height = h * dpr;
        THREE_NS = createScopedThreejs(node);
        const THREE = THREE_NS;
        renderer = new THREE.WebGLRenderer({ canvas: node, antialias: false });
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h);
        renderer.setClearColor(0xf5f3ff, 1);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
        camera.position.set(Math.sin(orbitAngle) * 2.35, 1.05, Math.cos(orbitAngle) * 2.35);
        camera.lookAt(0, 0.85, 0);
        raycaster = new THREE.Raycaster();
        bodyEntries = buildBodyAvatar(THREE, scene);
        syncColors();
        loopMp();
      } catch {
        emit("fail");
      }
    });
}

function onTouchStart(e: any) {
  const t = e.touches?.[0];
  if (!t) return;
  dragging = true;
  moved = false;
  lastX = t.clientX;
}

function onTouchMove(e: any) {
  if (!dragging || !camera) return;
  const t = e.touches?.[0];
  if (!t) return;
  const dx = t.clientX - lastX;
  if (Math.abs(dx) > 2) moved = true;
  lastX = t.clientX;
  orbitAngle += dx * 0.007;
  camera.position.x = Math.sin(orbitAngle) * 2.35;
  camera.position.z = Math.cos(orbitAngle) * 2.35;
  camera.position.y = 1.05;
  camera.lookAt(0, 0.85, 0);
}

function onTouchEnd(e: any) {
  dragging = false;
  const t = e.changedTouches?.[0];
  if (!t || moved) return;
  const q = mpComponentProxy
    ? uni.createSelectorQuery().in(mpComponentProxy)
    : uni.createSelectorQuery();
  q.select("#sl-body-gl")
    .boundingClientRect((rect: any) => {
      if (rect && rect.width) pick(t.clientX, t.clientY, rect);
    })
    .exec();
}
// #endif

// #ifdef H5
function fitH5Renderer() {
  const canvas = h5CanvasRef.value;
  if (!canvas || !renderer || !camera || disposed) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 4 || h < 4) return;
  const pr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

async function initH5() {
  try {
    const THREE = await import("three");
    THREE_NS = THREE;
    await nextTick();

    let tries = 0;
    const start = () => {
      if (disposed) return;
      const canvas = h5CanvasRef.value;
      if (!canvas) {
        if (tries++ < 30) {
          requestAnimationFrame(start);
          return;
        }
        emit("fail");
        return;
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 4 || h < 4) {
        if (tries++ < 30) {
          requestAnimationFrame(start);
          return;
        }
        emit("fail");
        return;
      }

      canvasEl = canvas;
      canvas.style.touchAction = "none";

      const rendererInst = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      rendererInst.setPixelRatio(pr);
      rendererInst.setSize(w, h, false);
      rendererInst.setClearColor(0xf5f3ff, 1);
      renderer = rendererInst;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
      let h5Yaw = 0.9;
      camera.position.set(Math.sin(h5Yaw) * 2.35, 1.05, Math.cos(h5Yaw) * 2.35);
      camera.lookAt(0, 0.85, 0);
      raycaster = new THREE.Raycaster();
      bodyEntries = buildBodyAvatar(THREE, scene);
      syncColors();

      /** 不用 OrbitControls，避免与 uni-app H5 上 pointer/触摸默认行为冲突导致无法旋转 */
      let drag = false;
      let lastPx = 0;
      let moved = false;
      const onDown = (ev: PointerEvent) => {
        drag = true;
        moved = false;
        lastPx = ev.clientX;
        try {
          canvas.setPointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
      };
      const onMove = (ev: PointerEvent) => {
        if (!drag || !camera) return;
        const dx = ev.clientX - lastPx;
        if (Math.abs(dx) > 1) moved = true;
        lastPx = ev.clientX;
        h5Yaw += dx * 0.007;
        camera.position.x = Math.sin(h5Yaw) * 2.35;
        camera.position.z = Math.cos(h5Yaw) * 2.35;
        camera.position.y = 1.05;
        camera.lookAt(0, 0.85, 0);
      };
      const onUp = (ev: PointerEvent) => {
        if (!drag) return;
        drag = false;
        try {
          canvas.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        if (!moved) {
          const r = canvas.getBoundingClientRect();
          pick(ev.clientX, ev.clientY, r);
        }
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      h5ResizeListener = () => fitH5Renderer();
      window.addEventListener("resize", h5ResizeListener);
      const animate = () => {
        if (disposed) return;
        rafId = requestAnimationFrame(animate) as unknown as number;
        renderer.render(scene, camera);
      };
      animate();
    };

    requestAnimationFrame(() => requestAnimationFrame(start));
  } catch {
    emit("fail");
  }
}
// #endif

onMounted(() => {
  // #ifdef MP-WEIXIN
  mpInitAttempts = 0;
  // #endif
  nextTick(() => {
    const delay = (props.variant ?? "default") === "orb" ? 480 : 120;
    setTimeout(() => {
      // #ifdef MP-WEIXIN
      initMp();
      // #endif
      // #ifdef H5
      initH5();
      // #endif
    }, delay);
  });
});

onUnmounted(() => {
  disposed = true;
  // #ifdef H5
  if (h5ResizeListener) {
    window.removeEventListener("resize", h5ResizeListener);
    h5ResizeListener = null;
  }
  // #endif
  // #ifdef MP-WEIXIN
  if (canvasEl && typeof canvasEl.cancelAnimationFrame === "function" && rafId) {
    canvasEl.cancelAnimationFrame(rafId);
  }
  // #endif
  // #ifdef H5
  if (rafId) cancelAnimationFrame(rafId);
  // #endif
});
</script>

<template>
  <view class="wrap" :class="{ orb: (props.variant ?? 'default') === 'orb' }">
    <!-- #ifdef MP-WEIXIN -->
    <canvas
      id="sl-body-gl"
      type="webgl"
      :canvas-id="mpCanvasIdStr"
      class="sl-cv"
      :style="mpOrbInlineStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    <!-- #endif -->
    <!-- #ifdef H5 -->
    <canvas ref="h5CanvasRef" id="sl-body-gl-h5" class="sl-cv" />
    <!-- #endif -->
    <text v-if="props.hintText" class="hint">{{ props.hintText }}</text>
  </view>
</template>

<style lang="scss" scoped>
.wrap {
  width: 100%;
  margin-top: 8rpx;
}
.wrap.orb {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  min-height: 0;
  display: block;
}
.sl-cv {
  width: 100%;
  height: 440rpx;
  border-radius: 20rpx;
  display: block;
  background: rgba(255, 255, 255, 0.35);
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
.wrap.orb .sl-cv {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 0;
  display: block;
  vertical-align: top;
  background: #f5f3ff;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #6b21a8;
  opacity: 0.85;
  line-height: 1.5;
}
</style>
