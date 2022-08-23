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
        <package-part
          v-if="currentPart"
          :part="currentPart"
          @update-part-content="updatePartContent"
        ></package-part>
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
} from "naive-ui";
import { FolderFilled } from "@vicons/antd";
import { Image, Xml } from "@vicons/carbon";
import openxml from "openxml";
import { computed, onMounted, ref, h, unref, toRaw, reactive, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { save } from "@tauri-apps/api/dialog";
import { readBinaryFile, writeBinaryFile } from "@tauri-apps/api/fs";
import useRecentFiles from "../hooks/useRecentFiles";
import { homeDir, sep } from "@tauri-apps/api/path";
import PackagePart from "../components/PackagePart.vue";

const route = useRoute();
const { records, addRecord } = useRecentFiles();

const docPackage = ref(null);
const loadingFile$ = ref(true);

async function readFile(filename) {
  return readBinaryFile(filename).then((fileResult) => {
    return {
      filename,
      fileResult,
    };
  });
}

watchEffect(async () => {
  loadingFile$.value = true;

  const { filePath, fromHistory = false } = route.query;
  const { filename, fileResult } = await readFile(filePath);
  docPackage.value = new openxml.OpenXmlPackage(fileResult);
  if (!fromHistory) {
    const pathParts = filename.split(sep);
    addRecord({
      fullPath: filename,
      name: pathParts[pathParts.length - 1],
    });
  }

  loadingFile$.value = false;
});

class Tree {
  constructor() {
    this.root = {
      children: [],
    };
  }

  insertLeaf(leaf) {
    const segments = leaf.key.split("/").filter(Boolean);
    const parentSegments = segments.slice(0, -1);
    let parent = this.root;
    for (let i = 0; i < parentSegments.length; i++) {
      const key = parentSegments.slice(0, i + 1).join("/");
      let treeNode = parent.children.find((i) => i.key === key);
      if (!treeNode) {
        treeNode = {
          key: key,
          label: parentSegments[i],
          children: [],
        };
        parent.children.push(treeNode);
      }
      parent = treeNode;
    }

    parent.children.push(leaf);
  }

  static parseLeafNode(part) {
    const isBinary = part.partType === "binary";
    return {
      key: part.uri,
      label: part.uri,
      children: [],
      isLeaf: true,
      prefix() {
        const icon = isBinary ? Image : Xml;
        return h(NIcon, null, { default: () => h(icon) });
      },
    };
  }
}

const treeData = computed(() => {
  if (!docPackage.value) {
    return [];
  }

  const tree = new Tree();
  Object.values(docPackage.value.parts).forEach((part) => {
    const leaf = Tree.parseLeafNode(part);
    tree.insertLeaf(leaf);
  });

  return tree.root.children;
});

const activeUri = ref(null);
const userHomeDir = ref(null);

const currentPart = computed(() => {
  if (activeUri.value) {
    const part = docPackage.value.parts[activeUri.value];
    return reactive({
      ...toRaw(part),
    });
  }
});

onMounted(() => {
  homeDir().then((dir) => {
    userHomeDir.value = dir;
  });
});

function updatePartContent({ content, exportFile = false }) {
  const currentPart = docPackage.value.parts[activeUri.value];
  currentPart.data = content;
  if (exportFile) {
    openExportDialog();
  }
}

async function openExportDialog() {
  const exportFilePath = await save({
    defaultPath: userHomeDir.value,
  });
  const unrefPackage = toRaw(unref(docPackage.value));
  const fileBlob = unrefPackage.saveToBlob();
  const contents = await fileBlob.arrayBuffer();
  try {
    await writeBinaryFile({ path: exportFilePath, contents });
  } catch (e) {
    console.error(e);
  }
}

function handleSelectedKeysUpdate(keys, options) {
  if (!keys.length > 0) {
    return;
  }
  const key = keys[0];
  const option = options[0];
  if (option.children.length === 0 && key) {
    activeUri.value = key;
  }
}

function renderSwitcherIcon() {
  return h(NIcon, null, { default: () => h(FolderFilled) });
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
</style>
