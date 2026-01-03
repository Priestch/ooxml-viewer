<script setup>
import { appWindow } from "@tauri-apps/api/window";
import "./assets/app.css";
import { onMounted } from "vue";
import useRecentFiles from "./hooks/useRecentFiles";
import { useRouter } from "vue-router";
import { service } from "./service.js";
import { NConfigProvider, NGlobalStyle, darkTheme } from "naive-ui";

const router = useRouter();

const { clearRecords } = useRecentFiles();

// Naive UI theme overrides to match design tokens
const themeOverrides = {
  common: {
    primaryColor: "#171717",
    primaryColorHover: "#262626",
    primaryColorPressed: "#000000",
    textColorBase: "#171717",
    textColor1: "#171717",
    textColor2: "#525252",
    textColor3: "#737373",
    borderColor: "#e5e5e5",
    dividerColor: "#e5e5e5",
  },
};

if (window.__TAURI__) {
  appWindow.listen("open", async () => {
    const filePath = await service.openFileDialog();
    router.push({ path: "/document", query: { filePath } });
  });
}

onMounted(() => {
  if (!window.__TAURI__) {
    clearRecords();
  }
  const router = useRouter();
  router.push({ path: "/" });
});
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-global-style />
    <router-view></router-view>
  </n-config-provider>
</template>

<style>
#app {
  height: 100%;
}
</style>
