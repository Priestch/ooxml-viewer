import { ref } from 'vue';

function loadRecentFiles() {
  const recentFiles = localStorage.getItem('recentFiles');
  return recentFiles ? JSON.parse(recentFiles) : [];
}

function setRecentFiles(recentFiles) {
  const files = [];
  for (const file of recentFiles) {
    files.push(file);
  }
  localStorage.setItem('recentFiles', JSON.stringify(files));
}

export default function useRecentFiles(size = 5) {
  const records = ref(loadRecentFiles());

  function addRecord(record) {
    const recordsValue = records.value;
    const recordExists = recordsValue.find((current) => {
      return current.fullPath === record.fullPath;
    });
    if (recordExists) {
      return;
    }
    recordsValue.push(record);
    if (recordsValue.length > size) {
      recordsValue.shift()
    }

    setRecentFiles(recordsValue);
  }

  return {
    addRecord,
    records,
  }
}
