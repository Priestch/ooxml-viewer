import Document from './views/Document.vue';
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: '/', redirect: '/document' },
  { path: '/document', component: Document },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router;
