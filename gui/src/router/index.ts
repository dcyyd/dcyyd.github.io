import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '工作台', icon: 'home' }
  },
  {
    path: '/editor/:slug?',
    name: 'editor',
    component: () => import('@/views/EditorView.vue'),
    meta: { title: '编辑器', icon: 'edit' }
  },
  {
    path: '/files',
    name: 'files',
    component: () => import('@/views/FilesView.vue'),
    meta: { title: '文件管理', icon: 'folder' }
  },
  {
    path: '/deploy',
    name: 'deploy',
    component: () => import('@/views/DeployView.vue'),
    meta: { title: '一键部署', icon: 'rocket' }
  },
  {
    path: '/help',
    name: 'help',
    component: () => import('@/views/HelpView.vue'),
    meta: { title: '使用指引', icon: 'help' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
