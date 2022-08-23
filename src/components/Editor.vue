<template>
  <n-space class="editor-header">
    <n-button type="primary" :disabled="!editorContentChanged$" @click="exportAsFile">
      Export
    </n-button>
  </n-space>
  <div id="editor" ref="rootRef"></div>
</template>

<script setup>
import openxml from "openxml";
import { EditorState } from "@codemirror/state";
import { beautifyXML, minXML } from "../utils";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { foldGutter, foldKeymap } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap, search } from "@codemirror/search";
import { defaultKeymap } from "@codemirror/commands";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
import { onMounted, ref, watch, unref } from "vue";
import { NButton, NSpace } from "naive-ui";

const props = defineProps({
  part: Object,
});

const emit = defineEmits(["updateContent"]);

const editorContentChanged$ = ref(false);

const largeFontPanel = EditorView.theme({
  ".cm-panels": { fontSize: "18px", padding: "6px 4px" },
});

function createExtensions() {
  const basicSetup = [
    lineNumbers(),
    highlightSpecialChars(),
    foldGutter(),
    drawSelection(),
    drawSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    search({ top: true }),
    keymap.of([...defaultKeymap, ...searchKeymap, ...foldKeymap]),
  ];

  return [...basicSetup, xml(), oneDark, largeFontPanel];
}

function createEditorState(data) {
  const value = openxml.util.decode_utf8(data);
  return EditorState.create({
    doc: beautifyXML(value),
    extensions: createExtensions(),
  });
}

function dispatch(tr) {
  if (tr.docChanged) {
    const content = openxml.util.encode_utf8(minXML(tr.newDoc.toJSON().join("\n")));
    emit("updateContent", { content });
    editorContentChanged$.value = true;
  }
  this.update([tr]);
}

function createEditorView(data, parent) {
  const state = createEditorState(data);
  return new EditorView({ state, parent, dispatch });
}

function exportAsFile() {
  const xmlContent = editorView.value.state.doc.toJSON().join("\n");
  const content = openxml.util.encode_utf8(minXML(xmlContent));
  emit("updateContent", { content, exportFile: true });
}

const editorView = ref(null);
const rootRef = ref(null);

watch(
  () => props.part.data,
  () => {
    if (editorView.value) {
      editorView.value.destroy();
      editorView.value = createEditorView(props.part.data, rootRef.value);
      editorContentChanged$.value = false;
      // editorView.value.setState(createEditorState(props.part.data));
    }
  }
);

onMounted(() => {
  editorView.value = createEditorView(props.part.data, rootRef.value);
});
</script>

<style lang="scss" scoped>
.editor-header {
  padding: 1em;
}
#editor {
  height: 100%;
  & :deep(.cm-editor) {
    height: 100%;
  }
}
</style>
