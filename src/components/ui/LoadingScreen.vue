<template>
  <div class="loading-screen">
    <div class="loading-logo">
      <svg viewBox="0 0 200 200" class="epic-logo">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :style="{ stopColor: 'var(--accent-primary)', stopOpacity: 1 }" />
            <stop offset="100%" :style="{ stopColor: 'var(--accent-secondary)', stopOpacity: 1 }" />
          </linearGradient>
        </defs>
        
        <!-- Outer ring with rotating animation -->
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="none" 
          stroke="url(#logoGradient)" 
          stroke-width="4"
          stroke-dasharray="20 10"
          class="animate-spin"
        />
        
        <!-- Inner geometric pattern -->
        <polygon 
          points="100,20 160,80 140,140 60,140 40,80" 
          fill="url(#logoGradient)" 
          opacity="0.8"
        />
        
        <!-- Center core -->
        <circle 
          cx="100" 
          cy="100" 
          r="25" 
          fill="var(--accent-primary)"
          class="animate-pulse"
        />
        
        <!-- Game controller elements -->
        <rect x="85" y="85" width="30" height="30" rx="5" fill="var(--bg-primary)" />
        <circle cx="100" cy="100" r="8" fill="var(--accent-primary)" />
      </svg>
    </div>
    
    <h1 class="loading-title">Epic Online Adventure</h1>
    <p class="loading-subtitle">Initializing the realm...</p>
    
    <div class="loading-progress">
      <div 
        class="loading-progress-bar" 
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
    
    <p class="loading-text">
      {{ loadingText }}<span class="loading-dots"></span>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Reactive state
const progress = ref(0)
const loadingText = ref('Loading assets')

// Loading messages
const loadingMessages = [
  'Loading assets',
  'Connecting to server',
  'Initializing game world',
  'Preparing your adventure',
  'Almost ready'
]

let messageIndex = 0
let progressInterval = null
let messageInterval = null

onMounted(() => {
  // Simulate loading progress
  progressInterval = setInterval(() => {
    if (progress.value < 100) {
      // Simulate realistic loading curve
      const increment = Math.random() * 15 + 5
      progress.value = Math.min(progress.value + increment, 100)
    }
  }, 300)
  
  // Cycle through loading messages
  messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % loadingMessages.length
    loadingText.value = loadingMessages[messageIndex]
  }, 1500)
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  if (messageInterval) {
    clearInterval(messageInterval)
  }
})
</script>

<style scoped>
.epic-logo {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 20px var(--accent-primary));
}

.epic-logo .animate-spin {
  animation: spin 3s linear infinite;
}

.epic-logo .animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  from { transform-origin: center; transform: rotate(0deg); }
  to { transform-origin: center; transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* Additional loading screen animations */
.loading-screen {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-title {
  animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 10px var(--accent-primary); }
  50% { text-shadow: 0 0 30px var(--accent-primary), 0 0 50px var(--accent-secondary); }
}
</style>