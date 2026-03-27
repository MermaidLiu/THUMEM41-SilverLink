<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("SilverLink App Launch");
});
onShow(() => {});
onHide(() => {});
</script>

<template></template>

<style lang="scss">
@import "@/uni.scss";

page {
  background: linear-gradient(168deg, #ede9fe 0%, #fae8ff 45%, #e9d5ff 100%);
  color: $uni-text-color;
  font-size: $uni-font-size-base;
}

input,
textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: block;
}

button[type="primary"] {
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  border: none;
}
</style>
