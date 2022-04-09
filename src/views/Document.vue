<template>
  <n-layout :has-sider="true" v-show="!modalVisible" class="package-viewer" position="absolute">
    <n-layout-sider content-style="padding: 20px 10px;" :bordered="true" collapse-mode="width" :width="400">
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
      <package-part v-if="activeUri && docPackage.parts[activeUri]" :part="docPackage.parts[activeUri]"></package-part>
    </n-layout-content
    >
  </n-layout>

  <n-modal v-model:show="modalVisible" class="welcome-modal" transform-origin="center" preset="card"
           :mask-closable="false" :style="modalStyle" :close-on-esc="false">
    <n-grid cols="1 800:2" style="min-height: 500px;" :item-response="true">
      <n-gi class="left-section">
        <div class="column-content" @click="openFileDialog">
          <n-icon size="40">
            <cloud-upload-outlined/>
          </n-icon>
          <div>OPEN A FILE</div>
        </div>
      </n-gi>
      <n-gi class="right-section">
        <n-data-table class="history-records" :columns="columns" :row-props="rowProps" :data="historyRecords"
                      :striped="true"/>
      </n-gi>
    </n-grid>
  </n-modal>
</template>

<script setup>
import {
  NModal,
  NDataTable,
  NIcon,
  NGrid,
  NGi,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutFooter,
  NLayoutSider,
  NTree,
  NPopover,
  NButton
} from 'naive-ui';
import { CloudUploadOutlined } from '@vicons/material';
import { FolderFilled } from '@vicons/antd';
import { Image, Xml } from '@vicons/carbon';
import openxml from 'openxml';
import { computed, onMounted, ref, h } from 'vue';
import { open } from "@tauri-apps/api/dialog";
import { readBinaryFile } from "@tauri-apps/api/fs";
import useRecentFiles from '../hooks/useRecentFiles';
import { homeDir, sep } from "@tauri-apps/api/path";
import PackagePart from '../components/PackagePart.vue'

class Tree {
  constructor() {
    this.root = {
      children: [],
    }
  }

  insertLeaf(leaf) {
    const segments = leaf.key.split("/").filter(Boolean);
    const parentSegments = segments.slice(0, -1);
    let parent = this.root;
    for (let i = 0; i < parentSegments.length; i++) {
      const key = parentSegments.slice(0, i + 1).join('/');
      let treeNode = parent.children.find((i) => i.key === key);
      if (!treeNode) {
        treeNode = {
          key: key,
          label: parentSegments[i],
          children: [],
        }
        parent.children.push(treeNode);
      }
      parent = treeNode;
    }

    parent.children.push(leaf);
  }

  static parseLeafNode(part) {
    const isBinary = part.partType === 'binary';
    return {
      key: part.uri,
      label: part.uri,
      children: [],
      isLeaf: true,
      prefix() {
        const icon = isBinary ? Image : Xml;
        return h(NIcon, null, { default: () => h(icon) })
      }
    }
  }
}

const {records, addRecord} = useRecentFiles();

const modalVisible = ref(false)
const docPackage = ref(null);

const treeData = computed(() => {
  if (!docPackage.value) {
    return []
  }

  const tree = new Tree();
  Object.values(docPackage.value.parts).forEach((part) => {
    const leaf = Tree.parseLeafNode(part);
    tree.insertLeaf(leaf)
  })

  return tree.root.children;
})

const activeUri = ref(null);

function handleClickRecentFile(row) {
  return readFile(row.fullPath)
      .then(({fileResult}) => {
        docPackage.value = new openxml.OpenXmlPackage(fileResult);
        modalVisible.value = false;
      })
}

const columns = [
  {
    title: 'Recent Opened Files',
    key: 'name',
    width: 100,
    ellipsis: {
      tooltip: true,
    },
  },
]

const historyRecords = records.value.map((record, index) => {
  return {
    key: index,
    ...record,
  }
})

const rowProps = (row) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      handleClickRecentFile(row)
    }
  }
}

const modalStyle = {
  '--n-padding-left': 0,
  '--n-padding-right': 0,
  '--n-padding-bottom': 0,
}

onMounted(() => {
  modalVisible.value = true;
})

function readFile(filename) {
  return readBinaryFile(filename)
      .then((fileResult) => {
        return {
          filename,
          fileResult,
        }
      });
}

function openFileDialog(event) {
  const dialogOptionsPromise = homeDir()
      .then((dir) => {
        return {
          defaultPath: dir,
          directory: false,
          filters: [{name: 'Office Files', extensions: ['docx']}],
          multiple: false,
        };
      });

  dialogOptionsPromise
      .then(open)
      .then(readFile)
      .then(({fileResult, filename}) => {
        const pathParts = filename.split(sep);
        addRecord({
          fullPath: filename,
          name: pathParts[pathParts.length - 1],
        });
        docPackage.value = new openxml.OpenXmlPackage(fileResult);
        modalVisible.value = false;
      })
      .catch(reason => {
        console.error('reason', reason);
      })
}

function handleSelectedKeysUpdate(keys, options) {
  if (!keys.length > 0) {
    return;
  }
  const key = keys[0]
  const option = options[0]
  if (option.children.length === 0 && key) {
    activeUri.value = key;
  }
}

function renderSwitcherIcon() {
  return h(NIcon, null, { default: () => h(FolderFilled) })
}

const treeStyle = {
  '--n-font-size': '1.2em',
}
</script>

<style scoped lang="scss">
.package-viewer {
  height: 100%;
}

.welcome-modal {
  .n-card-header {
    display: none;
  }
}

.left-section {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid lightgray;

  .column-content {
    width: 100%;
    text-align: center;
    cursor: pointer;
  }
}

.right-section {
  .history-records {
    height: 100%;

    :deep(.n-data-table-wrapper) {
      height: 100%;
    }
  }
}

.user-operations {
  padding: 20px 20px;
  border: 2px dashed darkcyan;

  .open-btn {
    height: 100px;
    font-size: larger;
  }
}
</style>

<style lang="scss">
.welcome-modal {
  width: 30%;

  .n-card-header {
    display: none;
  }
}

@media (max-width: 1600px) {
  .welcome-modal {
    width: 80%;
  }
}
</style>
