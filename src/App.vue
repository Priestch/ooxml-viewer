<script setup>
import { appWindow } from "@tauri-apps/api/window";
import "./assets/app.css";
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { service } from "./service.js";

const router = useRouter();

if (window.__TAURI__) {
  appWindow.listen("open", async () => {
    const filePath = await service.openFileDialog();
    router.push({ path: "/document", query: { filePath } });
  });
}

onMounted(() => {
  const router = useRouter();
  router.push({ path: "/" });
});
</script>

<template>
  <router-view></router-view>
</template>

<style>
#app {
  height: 100%;
}
</style>
