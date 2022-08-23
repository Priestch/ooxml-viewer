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

const props = defineProps({
  part: Object,
});

const emit = defineEmits(["updatePartContent"]);

const partType$ = computed(() => {
  if (props.part.contentType.startsWith("image")) {
    return "image";
  }

  return props.part.partType;
});

const updateContent = (payload) => {
  emit("updatePartContent", payload);
};

const components = {
  xml: Editor,
  image: ImageViewer,
};
</script>
