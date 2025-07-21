<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, nextTick, watch } from 'vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'Contact', path: '/contact' },
  { name: 'Wizard', path: '/wizard' },
  { name: 'Dynamic', path: '/dynamic' },
]

const activeIndex = computed(() => {
  return tabs.findIndex(tab => route.path.startsWith(tab.path))
})

function goToTab(idx) {
  router.push(tabs[idx].path)
}

// --- Glider position logic ---
const tabRefs = ref([])
const gliderStyle = ref({ left: '0px', width: '0px' })

function updateGlider() {
  nextTick(() => {
    const idx = activeIndex.value
    const el = tabRefs.value[idx]
    if (el) {
      const { offsetLeft, offsetWidth } = el
      gliderStyle.value = {
        left: offsetLeft + 'px',
        width: offsetWidth + 'px',
        transition: '0.25s ease-out',
      }
    }
  })
}

onMounted(updateGlider)
watch(activeIndex, updateGlider)
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
    <nav class="tabs">
      <template v-for="(tab, idx) in tabs" :key="tab.path">
        <a
          class="tab"
          :class="{ 'tab--active': activeIndex === idx }"
          @click.prevent="goToTab(idx)"
          href="#"
          ref="el => tabRefs.value[idx] = el"
        >
          {{ tab.name }}
        </a>
      </template>
      <div class="glider" :style="gliderStyle"></div>
    </nav>
  </header>
  <main>
    <router-view />
  </main>
</template>

<style lang="scss">
header {
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo {
  display: block;
  margin: 0 auto 2rem;
}
.tabs {
  margin-top: 1rem;
  justify-content: center;
  align-items: center;
}
.tab {
  position: relative;
  z-index: 2;
  text-decoration: none;
  color: #222;
  font-weight: 500;
  transition: color 0.15s;
  text-align: center;
}
.tab--active {
  color: #185ee0;
}
</style>
