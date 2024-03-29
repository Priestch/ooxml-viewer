import { open, save } from "@tauri-apps/api/dialog";
import { createPromise } from "./utils.js";
import { readBinaryFile, writeBinaryFile } from "@tauri-apps/api/fs";
import { homeDir } from "@tauri-apps/api/path";

const userHomeDir = createPromise();

const supportedExtensions = ["docx", "xlsx", "pptx"];
const inputAccept = supportedExtensions
  .map(function (ext) {
    return `.${ext}`;
  })
  .join(",");

function getFileUseTauri(filename) {
  return readBinaryFile(filename).then((fileResult) => {
    return {
      filename,
      fileResult,
    };
  });
}

async function saveFileUseTauri(fileContent) {
  const defaultPath = await userHomeDir.promise;
  const exportFilePath = await save({
    defaultPath,
  });
  try {
    await writeBinaryFile({ path: exportFilePath, contents: fileContent });
  } catch (e) {
    console.error(e);
  }
}

function createService(isDesktop = false) {
  return {
    async openFileDialog() {
      if (isDesktop) {
        const dir = await userHomeDir.promise;
        const dialogOptions = {
          defaultPath: dir,
          directory: false,
          filters: [{ name: "Office Files", extensions: supportedExtensions }],
          multiple: false,
        };

        try {
          let filePath = await open(dialogOptions);
          return {
            filePath,
          };
        } catch (error) {
          console.error("Error occurred when open file, detail: ", error);
        }

        return null;
      }

      return new Promise(function (resolve, reject) {
        let inputEl = document.createElement("input");
        inputEl.setAttribute("type", "file");
        function handleFileChange(event) {
          const files = event.target.files;
          const blobUrl = URL.createObjectURL(files[0]);
          const url = new URL(blobUrl);
          resolve({
            filePath: url.pathname.replace(url.origin, "").slice(1),
            url: blobUrl,
            filename: files[0].name,
          });
        }

        inputEl.setAttribute("accept", inputAccept);
        inputEl.addEventListener("change", handleFileChange);
        inputEl.click();
      });
    },
    async getFile({ filename }) {
      if (isDesktop) {
        return getFileUseTauri(filename);
      } else {
      }
    },
    resolveHomeDir() {
      if (window.__TAURI__) {
        homeDir().then((dir) => {
          userHomeDir.resolve(dir);
        });
      }
    },
    async exportFile(docPackage, filename = "") {
      const fileBlob = docPackage.saveToBlob();
      if (window.__TAURI__) {
        const fileContent = await fileBlob.arrayBuffer();
        await saveFileUseTauri(fileContent);
      } else {
        const url = window.URL.createObjectURL(fileBlob);
        const anchorEl = document.createElement("a");
        anchorEl.href = url;
        anchorEl.download = filename;
        anchorEl.click();
        window.URL.revokeObjectURL(url);
      }
    },
  };
}

const service = createService(Boolean(window.__TAURI__));

export { service };
