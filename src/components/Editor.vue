<template>
  <div id="editor" ref="rootRef$"></div>
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
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  part: Object,
});

const emit = defineEmits(["updateContent"]);

const largeFontPanel = EditorView.theme({
  ".cm-panels": { fontSize: "var(--text-lg)", padding: "var(--spacing-1) var(--spacing-1)" },
});

let initialText = "";

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
  const doc = beautifyXML(value);
  initialText = doc;
  return EditorState.create({
    doc,
    extensions: createExtensions(),
  });
}

function dispatch(tr) {
  if (tr.docChanged) {
    const content = openxml.util.encode_utf8(minXML(tr.newDoc.toJSON().join("\n")));
    const modified = tr.state.doc.sliceString(0) !== initialText;
    emit("updateContent", { content, modified });
  }
  this.update([tr]);
}

function createEditorView(data, parent) {
  const state = createEditorState(data);
  return new EditorView({ state, parent, dispatch });
}

const editorView$ = ref(null);
const rootRef$ = ref(null);

onMounted(() => {
  editorView$.value = createEditorView(props.part.originalContent, rootRef$.value);
});
</script>

<style lang="scss" scoped>
#editor {
  height: 100%;
  & :deep(.cm-editor) {
    height: 100%;
  }
}
</style>
