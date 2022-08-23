import { createRouter, createWebHashHistory } from "vue-router";
import Document from "./views/Document.vue";
import Home from "./views/Home.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/document", component: Document },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
