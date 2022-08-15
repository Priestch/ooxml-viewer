<template>
  <div id="editor" ref="rootRef"></div>
</template>

<script setup>
const props = defineProps({
  part: Object,
});

import openxml from "openxml";
import { EditorState } from "@codemirror/state";
import { formatXMLBeautify } from "../utils";
import { drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { foldGutter, foldKeymap } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap, search } from "@codemirror/search";
import { defaultKeymap } from "@codemirror/commands";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
import { onMounted, ref, watch, unref } from "vue";

const largeFontPanel = EditorView.theme({
  ".cm-panels": {fontSize: "18px", padding: "6px 4px"}
})

function createExtensions() {
  const basicSetup = [
    lineNumbers(),
    highlightSpecialChars(),
    foldGutter(),
    drawSelection(),
    drawSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    search({top: true}),
    keymap.of([
      ...defaultKeymap,
      ...searchKeymap,
      ...foldKeymap,
    ])
  ];

  return [...basicSetup, xml(), oneDark, largeFontPanel];
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
    // editorView.value.setState(createEditorState(props.part.data));
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