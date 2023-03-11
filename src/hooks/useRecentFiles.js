import { ref } from "vue";

const HISTORY_KEY = "recentFiles";
const storage = window.__TAURI__ ? localStorage : sessionStorage;

function loadRecentFiles() {
  const recentFiles = storage.getItem(HISTORY_KEY);
  return recentFiles ? JSON.parse(recentFiles) : [];
}

function setRecentFiles(recentFiles) {
  const files = [];
  for (const file of recentFiles) {
    files.push(file);
  }
  storage.setItem(HISTORY_KEY, JSON.stringify(files));
}

const records = ref(loadRecentFiles());

function clearRecords() {
  records.value = [];
  storage.removeItem(HISTORY_KEY);
}

export default function useRecentFiles(size = 5) {
  function addRecord(record) {
    const recordsValue = records.value;
    const recordExists = recordsValue.find((current) => {
      return current.filePath === record.filePath;
    });
    if (recordExists) {
      return;
    }
    recordsValue.push(record);
    if (recordsValue.length > size) {
      recordsValue.shift();
    }

    setRecentFiles(recordsValue);
  }

  return {
    addRecord,
    records,
    clearRecords,
  };
}
