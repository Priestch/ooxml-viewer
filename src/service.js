import { createPromise } from "./utils.js";

const userHomeDir = createPromise();

const supportedExtensions = ["docx", "xlsx", "pptx"];
const inputAccept = supportedExtensions
  .map(function (ext) {
    return `.${ext}`;
  })
  .join(",");

// Lazy Tauri imports - only loaded when needed
async function getFileUseTauri(filename) {
  const { readBinaryFile } = await import("@tauri-apps/api/fs");
  const fileResult = await readBinaryFile(filename);
  return {
    filename,
    fileResult,
  };
}

async function saveFileUseTauri(fileContent) {
  const { save } = await import("@tauri-apps/api/dialog");
  const { writeBinaryFile } = await import("@tauri-apps/api/fs");
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
        const { open } = await import("@tauri-apps/api/dialog");
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
        inputEl.style.display = "none";
        function handleFileChange(event) {
          const files = event.target.files;

          // Clean up input element
          if (inputEl && inputEl.parentNode) {
            inputEl.parentNode.removeChild(inputEl);
          }

          if (files && files.length > 0) {
            const blobUrl = URL.createObjectURL(files[0]);
            resolve({
              filePath: files[0].name,
              url: blobUrl,
              filename: files[0].name,
            });
          } else {
            // User cancelled or no file selected
            resolve(null);
          }
        }

        inputEl.setAttribute("accept", inputAccept);
        inputEl.addEventListener("change", handleFileChange);
        // Append to DOM for better browser compatibility
        document.body.appendChild(inputEl);
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
        import("@tauri-apps/api/path").then(({ homeDir }) => {
          homeDir().then((dir) => {
            userHomeDir.resolve(dir);
          });
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
