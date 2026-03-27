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
  background-color: $uni-bg-color-grey;
  color: $uni-text-color;
  font-size: $uni-font-size-base;
}
</style>
