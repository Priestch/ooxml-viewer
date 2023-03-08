import { onMounted, ref } from "vue";
import { service } from "../service.js";

export default function useFileUtils() {
  onMounted(() => {
    if (window.__TAURI__) {
      service.resolveHomeDir();
    }
  });

  async function openFileDialog() {
    return service.openFileDialog();
  }

  return {
    openFileDialog,
  };
}
