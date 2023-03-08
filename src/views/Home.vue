<template>
  <n-modal
    v-model:show="modalVisible$"
    class="welcome-modal"
    transform-origin="center"
    preset="card"
    :mask-closable="false"
    :style="modalStyle"
    :close-on-esc="false"
  >
    <n-grid cols="1 800:2" style="min-height: 500px" :item-response="true">
      <n-gi class="left-section">
        <div class="column-content" @click="selectFile">
          <n-icon size="40">
            <cloud-upload-outlined />
          </n-icon>
          <div>OPEN A FILE</div>
        </div>
      </n-gi>
      <n-gi class="right-section">
        <n-data-table
          class="history-records"
          :columns="columns"
          :row-props="rowProps"
          :data="historyRecords"
          :striped="true"
        />
      </n-gi>
    </n-grid>
  </n-modal>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { NGrid, NGi, NIcon, NDataTable, NModal } from "naive-ui";
import { CloudUploadOutlined } from "@vicons/material";
import useRecentFiles from "../hooks/useRecentFiles";
import useFileUtils from "../hooks/useFileUtils";

const router = useRouter();

const { records, addRecord } = useRecentFiles();
const { openFileDialog } = useFileUtils();

const historyRecords = records.value.map((record, index) => {
  return {
    key: index,
    ...record,
  };
});

const columns = [
  {
    title: "Recent Opened Files",
    key: "name",
    width: 100,
    ellipsis: {
      tooltip: true,
    },
  },
];

const rowProps = (row) => {
  return {
    style: "cursor: pointer;",
    onClick: () => {
      router.push({ path: "/document", query: { filePath: row.fullPath } });
    },
  };
};

const modalVisible$ = ref(true);
const modalStyle = {
  "--n-padding-left": 0,
  "--n-padding-right": 0,
  "--n-padding-bottom": 0,
};

async function selectFile() {
  const documentQuery = await openFileDialog();
  router.push({ path: "/document", query: documentQuery });
}
</script>

<style scoped lang="scss">
.package-viewer {
  height: 100%;
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
