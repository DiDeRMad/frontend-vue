<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const anime = window.anime
  anime({
    targets: '.letter__part',
    translateY: {
      value: [-30, 0],
      duration: 900,
      delay: 1000,
      elasticity: 600,
      easing: 'easeOutElastic'
    },
    opacity: {
      value: [0, 1],
      duration: 300,
      easing: 'linear',
      delay: 1000
    }
  })
  anime({
    targets: '.color-1',
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: 'easeOutElastic',
    duration: 4000,
    delay: 1000,
    loop: false,
    direction: 'alternate',
  })
  anime({
    targets: '.color-3',
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: 'easeOutElastic',
    duration: 4000,
    delay: 1200,
    loop: false,
    direction: 'alternate',
  })
  anime({
    targets: '.color-2',
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: 'easeOutElastic',
    duration: 4000,
    delay: 1400,
    loop: false,
    direction: 'alternate',
  })
})
</script>

<template>
  <svg width="90%" viewBox="0 0 800 100" class="letters letters--effect-1">
    <!-- Пример: только слово 'Contact' (для demo вставьте свой SVG) -->
    <g class="letter letter--1">
      <g class="letter__part">
        <path class="letter__layer color-1" d="M33,39.8c-1.2,7.4-4.2,12.4-11.7,12.4C10.8,52.2,9,42.1,9,29.7S10.8,7.2,21.3,7.2c7.4,0,10.5,5.1,11.7,12.4"/>
        <path class="letter__layer color-3" d="M33,39.8c-1.2,7.4-4.2,12.4-11.7,12.4C10.8,52.2,9,42.1,9,29.7S10.8,7.2,21.3,7.2c7.4,0,10.5,5.1,11.7,12.4"/>
        <path class="letter__layer color-2" d="M33,39.8c-1.2,7.4-4.2,12.4-11.7,12.4C10.8,52.2,9,42.1,9,29.7S10.8,7.2,21.3,7.2c7.4,0,10.5,5.1,11.7,12.4"/>
      </g>
    </g>
    <!-- ... Добавьте остальные буквы/слова для полного Contact Form Demo ... -->
  </svg>
</template>

<style scoped>
.color-3{
  stroke:#05ffa1;
  transform: translate3d(2px, 2px, 0);
  stroke-width: 6px;
}
.color-1{
  stroke:#ffffff;
  stroke-width: 8px;
}
.color-2{
  stroke:#01cdfe;
  transform: translate3d(2px, 2px, 0);
  stroke-width: 8px;
  z-index:9999;
}
.letters {
  left: 50%;
  transform:translateX(-50%);
  position: relative;
  stroke-miterlimit:3;
  fill:none;
  top: 20px;
  display: block;
  min-height: 100px;
  max-height: 70vh;
  margin: 0 auto;
  position: relative;
}
.letter__layer {
  fill: none;
}
</style> 