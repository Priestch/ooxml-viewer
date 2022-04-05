<template>
  <component :is="components[currentPart.partType]" :part="currentPart"></component>
</template>

<script setup>
import Editor from './Editor.vue';
import ImageViewer from './ImageViewer.vue'
import { computed} from "vue";

const props = defineProps({
  part: Object,
})

const currentPart = computed(() => {
  return props.part
});

const components = {
  'xml': Editor,
  'binary': ImageViewer,
}
</script>
