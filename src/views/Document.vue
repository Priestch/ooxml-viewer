<template>
  <n-spin :show="loadingFile$">
    <n-layout :has-sider="true" class="package-viewer" position="absolute">
      <n-layout-sider
        content-style="padding: 20px 10px;"
        :bordered="true"
        collapse-mode="width"
        :width="400"
      >
        <n-tree
          block-line
          :data="treeData"
          @update:selected-keys="handleSelectedKeysUpdate"
          :render-switcher-icon="renderSwitcherIcon"
          :style="treeStyle"
          selectable
        />
      </n-layout-sider>
      <n-layout-content>
        <n-tabs
          v-model:value="activeTab$"
          type="card"
          closable
          tab-style="min-width: 80px;"
          @update:value="onTabChange"
          @close="handleTabClose"
        >
          <n-tab-pane
            v-for="partUri in openParts$"
            :key="partUri"
            :tab="partUri.toString()"
            :name="partUri"
            display-directive="show:lazy"
          >
            <package-part
              :part="getPart(partUri, docPackage$)"
              @update-part-content="updatePartContent"
            ></package-part>
          </n-tab-pane>
        </n-tabs>
      </n-layout-content>
    </n-layout>
  </n-spin>
</template>

<script setup>
import {
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutFooter,
  NLayoutSider,
  NTree,
  NSpin,
  NTabs,
  NTabPane,
  NIcon,
} from "naive-ui";
import { FolderFilled } from "@vicons/antd";
import { Image, Xml } from "@vicons/carbon";
import openxml from "openxml";
import { computed, onMounted, ref, h, unref, toRaw, reactive, watchEffect, watch } from "vue";
import { useRoute } from "vue-router";
import useRecentFiles from "../hooks/useRecentFiles";
import PackagePart from "../components/PackagePart.vue";
import { service } from "../service.js";
import { createTree } from "../ooxml-utils.js";

function getPart(activeUri, docPackage) {
  if (activeUri) {
    const part = docPackage.parts[activeUri];
    return reactive({
      ...toRaw(part),
    });
  }
}

function handleTabClose(name) {
  if (name === activeUri$.value) {
    const currentIndex = openParts$.value.indexOf(name);
    if (currentIndex - 1 >= 0) {
      activeTab$.value = openParts$.value[currentIndex - 1];
    }
  }
  openParts$.value = openParts$.value.filter((i) => i !== name);
}

const route = useRoute();
const { records, addRecord } = useRecentFiles();

const docPackage$ = ref(null);
const loadingFile$ = ref(true);
const openParts$ = ref([]);

const activeTab$ = ref(null);

watchEffect(async () => {
  loadingFile$.value = true;

  let { filePath, fromHistory = false, url = "", filename = "" } = route.query;
  let fileResult;
  if (window.__TAURI__) {
    let { filename, fileResult } = await service.getFile({ filename: filePath });
    docPackage$.value = new openxml.OpenXmlPackage(fileResult);
  } else {
    fetch(url).then(async function (response) {
      const blob = await response.blob();
      fileResult = await blob.arrayBuffer();
      console.log("fileResult", fileResult);
      docPackage$.value = new openxml.OpenXmlPackage(fileResult);
    });
  }
  // console.log("watchEffect", filename, fileResult);
  // docPackage.value = new openxml.OpenXmlPackage(fileResult);
  // if (!fromHistory) {
  //   const pathParts = filename.split(sep);
  //   addRecord({
  //     fullPath: filename,
  //     name: pathParts[pathParts.length - 1],
  //   });
  // }

  loadingFile$.value = false;
});

const treeData = computed(() => {
  return createTree(docPackage$.value);
});

const activeUri$ = ref(null);
const userHomeDir$ = ref(null);

const currentPart = computed(() => {
  return getPart(activeUri$.value, docPackage$.value);
});

watch(activeUri$, () => {
  const exists = openParts$.value.find((i) => {
    return i === activeUri$.value;
  });
  if (activeUri$.value && !exists) {
    openParts$.value.push(activeUri$.value);
  }
  activeTab$.value = activeUri$.value;
});

onMounted(() => {
  // homeDir().then((dir) => {
  //   userHomeDir.value = dir;
  // });
});

function updatePartContent({ content, exportFile = false }) {
  const currentPart = docPackage$.value.parts[activeUri$.value];
  currentPart.data = content;
  if (exportFile) {
    service.exportFile(toRaw(unref(docPackage$.value)));
  }
}

function handleSelectedKeysUpdate(keys, options) {
  if (!keys.length > 0) {
    return;
  }
  const key = keys[0];
  const option = options[0];
  if (option.children.length === 0 && key) {
    activeUri$.value = key;
  }
}

function renderSwitcherIcon() {
  return h(NIcon, null, { default: () => h(FolderFilled) });
}

function onTabChange(val) {
  console.log("onTabChange", val);
}

const treeStyle = {
  "--n-font-size": "1.2em",
};
</script>

<style scoped lang="scss">
.package-viewer {
  height: 100%;
}

.n-spin-container {
  height: 100%;
}

.n-tabs {
  height: 100%;

  ::v-deep(.n-tab-pane) {
    height: 100%;
  }
}
</style>
