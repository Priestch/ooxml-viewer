<template>
  <component
    :is="components[partType$]"
    :part="props.part"
    @update-content="updateContent"
  ></component>
</template>

<script setup>
import Editor from "./Editor.vue";
import ImageViewer from "./ImageViewer.vue";
import { computed } from "vue";

function getContentType(part) {
  if (part.contentType && part.contentType.startsWith("image")) {
    return "image";
  }

  let items = part.uri.split(".");
  return part.partType || items[items.length - 1];
}

const props = defineProps({
  part: Object,
});

const emit = defineEmits(["updatePartContent"]);

const partType$ = computed(() => {
  return getContentType(props.part);
});

const updateContent = (payload) => {
  emit("updatePartContent", {
    uri: props.part.uri,
    content: payload.content,
  });
};

const components = {
  xml: Editor,
  image: ImageViewer,
};
</script>
