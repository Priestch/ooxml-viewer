<template>
  <div id="editor" ref="rootRef"></div>
</template>

<script setup>
const props = defineProps({
  part: Object,
});

import openxml from "openxml";
import { EditorState, Prec } from "@codemirror/state";
import { formatXMLBeautify } from "../utils";
import { lineNumbers } from "@codemirror/gutter";
import { drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { defaultKeymap } from "@codemirror/commands";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
import { onMounted, ref, watch, unref } from "vue";

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

function createEditorView(data, parent) {
  const state = createEditorState(data);
  return new EditorView({state, parent});
}

const editorView = ref(null);
const rootRef = ref(null)

watch(() => props.part.data, () => {
  if (editorView.value) {
    editorView.value.destroy();
    editorView.value = createEditorView(props.part.data, rootRef.value);
  }
})


onMounted(() => {
  editorView.value = createEditorView(props.part.data, rootRef.value);
})
</script>

<style lang="scss" scoped>
#editor {
  height: 100%;
  & :deep(.cm-editor) {
    height: 100%;
  }
}
</style>