<template>
  <component :is="components[props.part.partType]" :part="props.part" @update-content="updateContent"></component>
</template>

<script setup>
import Editor from './Editor.vue';
import ImageViewer from './ImageViewer.vue'
import { computed} from "vue";

const props = defineProps({
  part: Object,
})

const emit = defineEmits(['updatePartContent'])

const updateContent = (payload) => {
  emit('updatePartContent', payload);
}

const components = {
  'xml': Editor,
  'binary': ImageViewer,
}
</script>
