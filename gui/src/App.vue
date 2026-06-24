<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import ToastContainer from './components/ToastContainer.vue'

const dark = ref(false)

function applyTheme() {
  document.documentElement.classList.toggle('dark', dark.value)
  localStorage.setItem('gui:theme', dark.value ? 'dark' : 'light')
}

function toggleTheme() {
  dark.value = !dark.value
  applyTheme()
}

onMounted(() => {
  const saved = localStorage.getItem('gui:theme')
  dark.value = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  applyTheme()
})
</script>

<template>
  <div class="h-full flex" style="background: var(--paper);">
    <AppSidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader :dark="dark" @toggle-theme="toggleTheme" />
      <main class="flex-1 overflow-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <ToastContainer />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
