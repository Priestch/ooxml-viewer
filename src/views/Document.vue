<template>
  <n-layout :has-sider="true" v-show="!modalVisible" class="package-viewer" position="absolute">
    <n-layout-sider content-style="padding: 20px 10px;" :bordered="true" collapse-mode="width" :width="400">
      <n-tree
          block-line
          :data="treeData"
          @update:selected-keys="handleSelectedKeysUpdate"
          selectable
      />
    </n-layout-sider>
    <n-layout-content id="editor">
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
        <n-data-table class="history-records" :columns="columns" :row-props="rowProps" :data="historyRecords" :striped="true" />
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
import openxml from 'openxml';
import { ref, onMounted, computed, h } from 'vue';
import { open } from "@tauri-apps/api/dialog";
import { readBinaryFile } from "@tauri-apps/api/fs";
import { EditorState, Prec } from "@codemirror/state";
import { formatXMLBeautify } from "../utils";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
import { lineNumbers } from "@codemirror/gutter";
import { drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { defaultKeymap } from '@codemirror/commands';
import useRecentFiles from '../hooks/useRecentFiles';
import { homeDir, sep } from "@tauri-apps/api/path";

function getTreeData(pkg) {
  const data = [];
  Object.entries(pkg.parts).forEach(([id, part]) => {
    const pathItems = id.split('/').filter(Boolean);
    const topLevelId = pathItems[0];
    let index = data.findIndex((part) => part.key === topLevelId);
    let parentPart = data[index];
    if (!parentPart) {
      parentPart = {
        key: topLevelId,
        label: topLevelId,
        children: [],
      };
      data.push(parentPart)
    }
    if (pathItems.length > 1) {
      const isXML = pkg.parts[id].partType === 'xml';
      parentPart.children.push({
        key: id,
        label: id,
        children: [],
        disabled: !isXML,
      })
    }
  })

  return data;
}

const { records, addRecord } = useRecentFiles();

const modalVisible = ref(false)
const docPackage = ref(null);
const editorView = ref(null);

const treeData = computed(() => {
  if (!docPackage.value) {
    return []
  }

  return getTreeData(docPackage.value);
})

const activeUri = ref(null);

function handleClickRecentFile(row) {
  return readFile(row.fullPath)
      .then(({ fileResult }) => {
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

function createExtensions() {
  const basicSetup = [
    lineNumbers(),
    highlightSpecialChars(),
    foldGutter(),
    drawSelection(),
    drawSelection(),
    Prec.fallback(defaultHighlightStyle),
    rectangularSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...defaultKeymap,
      ...searchKeymap,
      ...foldKeymap,
    ])
  ];

  return [...basicSetup, xml(), oneDark];
}

function createEditorState(data) {
  const value = openxml.util.decode_utf8(data);
  return EditorState.create({
    doc: formatXMLBeautify(value),
    extensions: createExtensions(),
  });
}

function handleSelectedKeysUpdate(keys, options) {
  if (!keys.length > 0) {
    return;
  }
  const key = keys[0]
  const option = options[0]
  if (option.children.length === 0 && key) {
    activeUri.value = key;
    showFileContent(activeUri.value);
  }
}

function showFileContent(fileUri) {
  const part = docPackage.value.parts[fileUri];

  const editorContainer = document.querySelector('#editor .n-layout-scroll-container');
  const fileContent = part.data;
  const state = createEditorState(fileContent);
  if (!editorView.value) {
    editorView.value = new EditorView({state, parent: editorContainer});
  } else {
    editorView.value.destroy();
    editorView.value = new EditorView({state, parent: editorContainer});
  }
}
</script>

<style scoped lang="scss">
.package-viewer {
  height: 100%;

  & :deep(.cm-editor) {
    height: 100%;
  }
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
