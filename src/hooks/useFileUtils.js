import { homeDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/api/dialog";
import { onMounted, ref } from "vue";

const supportedExtensions = ["docx", "xlsx", "pptx"];

function createPromise() {
  let promiseResolve, promiseReject;

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  return {
    promise,
    resolve: promiseResolve,
    reject: promiseReject,
  };
}

export default function useFileUtils() {
  const userHomeDir$ = ref(createPromise());

  onMounted(() => {
    homeDir().then((dir) => {
      userHomeDir$.value.resolve(dir);
    });
  });

  async function openFileDialog() {
    const dir = await userHomeDir$.value.promise;
    const dialogOptions = {
      defaultPath: dir,
      directory: false,
      filters: [{ name: "Office Files", extensions: supportedExtensions }],
      multiple: false,
    };

    try {
      return open(dialogOptions);
    } catch (error) {
      console.error("Error occurred when open file, detail: ", error);
    }
  }

  return {
    openFileDialog,
  };
}
