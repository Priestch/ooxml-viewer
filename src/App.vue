<script setup>
import './assets/app.css'
import {onMounted} from "vue";
import {useRouter} from "vue-router";

onMounted(() => {
  const router = useRouter();
  router.push({ path: "/" })
})
</script>

<template>
  <router-view></router-view>
</template>

<style>
#app {
  height: 100%;
}
</style>
