<template>
  <n-spin :show="loadingFile$">
    <n-layout :has-sider="true" class="package-viewer" position="absolute">
      <n-layout-sider :bordered="true" collapse-mode="width" :width="400">
        <n-card siz="small">
          <n-space>
            <n-button type="primary" :disabled="!fileChanged$" @click="exportAsFile">
              Export
            </n-button>
          </n-space>
        </n-card>
        <div class="package-tree">
          <n-tree
            block-line
            :data="treeData"
            @update:selected-keys="handleSelectedKeysUpdate"
            :render-switcher-icon="renderSwitcherIcon"
            :style="treeStyle"
            selectable
          />
        </div>
      </n-layout-sider>
      <n-layout-content>
        <n-tabs
          class="part-tabs"
          v-model:value="activeTab$"
          type="card"
          closable
          @update:value="onTabChange"
          @close="handleTabClose"
        >
          <n-tab-pane
            v-for="part in openParts$"
            :key="part.uri"
            :name="part.uri"
            :tab="createPartTab(part)"
            display-directive="show:lazy"
          >
            <package-part :part="part" @update-part-content="updatePartContent"></package-part>
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
  NBadge,
  NIcon,
  NButton,
  NCard,
  NSpace,
  NDivider,
} from "naive-ui";
import { sep } from "@tauri-apps/api/path";
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

function handleTabClose(uri) {
  if (uri === activeUri$.value) {
    const currentIndex = openParts$.value.findIndex(function (i) {
      return i.uri === uri;
    });
    if (currentIndex - 1 >= 0) {
      activeTab$.value = openParts$.value[currentIndex - 1].uri;
    }
  }
  openParts$.value = openParts$.value.filter((i) => i.uri !== uri);
}

function createPartTab(part) {
  if (part.modified) {
    return h("div", {}, [h(NBadge, { offset: [5, 0], dot: true }, [h("span", {}, part.uri)])]);
  }
  return h("span", {}, part.uri);
}

const route = useRoute();
const { records, addRecord } = useRecentFiles();

const filename$ = ref("");

const docPackage$ = ref(null);
const loadingFile$ = ref(true);
const openParts$ = ref([]);

const fileChanged$ = ref(false);

const activeTab$ = ref(null);

watchEffect(async () => {
  loadingFile$.value = true;

  let { filePath, url = "", filename = "" } = route.query;
  filename$.value = filename;
  let fileResult;
  if (window.__TAURI__) {
    let { filename, fileResult } = await service.getFile({ filename: filePath });
    docPackage$.value = new openxml.OpenXmlPackage(fileResult);
    const pathParts = filename.split(sep);
    addRecord({
      filePath: filename,
      name: pathParts[pathParts.length - 1],
    });
  } else {
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      fileResult = await blob.arrayBuffer();
      docPackage$.value = new openxml.OpenXmlPackage(fileResult);
      addRecord({
        filePath: filename,
        name: filename,
        url,
      });
    } else {
      console.error("Failed to open file!");
    }
  }

  loadingFile$.value = false;
});

const treeData = computed(() => {
  return createTree(docPackage$.value);
});

const activeUri$ = ref(null);

const currentPart = computed(() => {
  return getPart(activeUri$.value, docPackage$.value);
});

watch(activeUri$, () => {
  const exists = openParts$.value.find((i) => {
    return i.uri === activeUri$.value;
  });
  if (activeUri$.value && !exists) {
    const part = getPart(activeUri$.value, docPackage$.value);
    openParts$.value.push({
      uri: activeUri$.value,
      modified: false,
      contentType: part.contentType,
      partType: part.partType,
      originalContent: part.data,
      latestContent: part.data,
    });
  }
  activeTab$.value = activeUri$.value;
});

function exportAsFile() {
  const docPackage = toRaw(unref(docPackage$.value));
  openParts$.value.forEach(function (tabPart) {
    const currentPart = docPackage.parts[tabPart.uri];
    currentPart.data = tabPart.latestContent;
  });
  service.exportFile(docPackage, filename$.value);

  openParts$.value.forEach(function (part) {
    part.modified = false;
  });
}

function updatePartContent({ content, uri, modified }) {
  fileChanged$.value = true;

  const part = openParts$.value.find(function (i) {
    return i.uri === uri;
  });
  if (part) {
    part.latestContent = content;
    part.modified = modified;
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

.package-tree {
  padding: 20px 10px;
}

.part-tabs {
  height: 100%;

  ::v-deep(.n-tab-pane) {
    height: calc(100% - 39px);
    overflow: auto;
  }

  ::v-deep(.n-tabs-tab__close) {
    margin-left: 8px;
  }
}
</style>
