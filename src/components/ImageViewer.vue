<template>
  <div class="image-viewer">
    <figure v-if="imageRef">
      <img :src="imageRef"
           alt="Elephant at sunset">
      <figcaption></figcaption>
    </figure>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import { transformTo } from 'jszip/lib/utils.js';

const canvasRef = ref(null);
const imageRef = ref(null);

const props = defineProps({
  part: Object,
})

function drawImage(part) {
  const imageData = transformTo('uint8array', part.data);
  const objURL = URL.createObjectURL(
      new Blob([imageData.buffer], { type: part.contentType })
  );
  imageRef.value = objURL;
}

function revokeImageUrl(url) {
  URL.revokeObjectURL(url);
}

watch(() => props.part, () => {
  if (imageRef.value) {
    revokeImageUrl(imageRef.value);
  }
  drawImage(props.part, canvasRef.value);
})

onMounted(() => {
  drawImage(props.part, canvasRef.value);
})

onBeforeUnmount(() => {
  if (imageRef.value) {
    revokeImageUrl(imageRef.value)
  }
})
</script>

<style lang="scss" scoped>
.image-viewer {
  img {
    border: 4px solid #fefefe;
    box-shadow: 0 0 0 1px rgb(10 10 10 / 20%);
  }
}
</style>
