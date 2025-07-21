<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-logo">
          <svg viewBox="0 0 200 200" class="epic-logo">
            <defs>
              <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" :style="{ stopColor: 'var(--accent-primary)', stopOpacity: 1 }" />
                <stop offset="100%" :style="{ stopColor: 'var(--accent-secondary)', stopOpacity: 1 }" />
              </linearGradient>
            </defs>
            
            <circle 
              cx="100" 
              cy="100" 
              r="90" 
              fill="none" 
              stroke="url(#heroGradient)" 
              stroke-width="4"
              stroke-dasharray="20 10"
              class="animate-spin"
            />
            
            <polygon 
              points="100,20 160,80 140,140 60,140 40,80" 
              fill="url(#heroGradient)" 
              opacity="0.8"
            />
            
            <circle 
              cx="100" 
              cy="100" 
              r="25" 
              fill="var(--accent-primary)"
              class="animate-pulse"
            />
            
            <rect x="85" y="85" width="30" height="30" rx="5" fill="var(--bg-primary)" />
            <circle cx="100" cy="100" r="8" fill="var(--accent-primary)" />
          </svg>
        </div>
        
        <h1 class="hero-title">Epic Online Adventure</h1>
        <p class="hero-subtitle">
          Embark on the ultimate multiplayer RPG experience in a vast fantasy world
        </p>
        
        <div class="hero-actions">
          <router-link to="/register" class="btn btn-primary btn-lg">
            Start Your Adventure
          </router-link>
          <router-link to="/login" class="btn btn-secondary btn-lg">
            Enter the Realm
          </router-link>
        </div>
        
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-number">12,847</div>
            <div class="stat-label">Active Players</div>
          </div>
          <div class="stat">
            <div class="stat-number">47</div>
            <div class="stat-label">Servers Online</div>
          </div>
          <div class="stat">
            <div class="stat-number">∞</div>
            <div class="stat-label">Adventures Await</div>
          </div>
        </div>
      </div>
      
      <div class="hero-background">
        <div class="floating-orb" style="--delay: 0s; --x: 20%; --y: 30%;"></div>
        <div class="floating-orb" style="--delay: 2s; --x: 70%; --y: 20%;"></div>
        <div class="floating-orb" style="--delay: 4s; --x: 80%; --y: 70%;"></div>
        <div class="floating-orb" style="--delay: 1s; --x: 10%; --y: 80%;"></div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">Epic Features</h2>
        <div class="features-grid">
          <div class="feature-card" v-for="feature in features" :key="feature.id">
            <div class="feature-icon">
              <component :is="feature.icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Classes Section -->
    <section class="classes">
      <div class="container">
        <h2 class="section-title">Choose Your Destiny</h2>
        <div class="classes-grid">
          <div class="class-card" v-for="charClass in classes" :key="charClass.id">
            <div class="class-image">
              <div class="class-placeholder">{{ charClass.name.charAt(0) }}</div>
            </div>
            <h3 class="class-name">{{ charClass.name }}</h3>
            <p class="class-description">{{ charClass.description }}</p>
            <div class="class-stats">
              <div class="class-stat" v-for="(value, stat) in charClass.stats" :key="stat">
                <span class="stat-name">{{ stat }}</span>
                <div class="stat-bar">
                  <div class="stat-fill" :style="{ width: `${value * 20}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- News Section -->
    <section class="news">
      <div class="container">
        <h2 class="section-title">Latest News</h2>
        <div class="news-grid">
          <article class="news-item" v-for="article in news" :key="article.id">
            <div class="news-date">{{ formatDate(article.date) }}</div>
            <h3 class="news-title">{{ article.title }}</h3>
            <p class="news-excerpt">{{ article.excerpt }}</p>
            <div class="news-tags">
              <span class="news-tag" v-for="tag in article.tags" :key="tag">{{ tag }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Features data
const features = ref([
  {
    id: 1,
    title: 'Massive Multiplayer World',
    description: 'Explore a vast persistent world with thousands of other players',
    icon: 'WorldIcon'
  },
  {
    id: 2,
    title: 'Epic PvP Battles',
    description: 'Engage in thrilling player vs player combat in arenas and battlegrounds',
    icon: 'SwordIcon'
  },
  {
    id: 3,
    title: 'Powerful Guilds',
    description: 'Join or create guilds to conquer dungeons and dominate territories',
    icon: 'ShieldIcon'
  },
  {
    id: 4,
    title: 'Rich Crafting System',
    description: 'Create legendary weapons and armor through advanced crafting',
    icon: 'HammerIcon'
  },
  {
    id: 5,
    title: 'Dynamic Events',
    description: 'Participate in world-changing events that shape the realm',
    icon: 'StarIcon'
  },
  {
    id: 6,
    title: 'Endless Progression',
    description: 'Level up, unlock skills, and customize your character endlessly',
    icon: 'TrophyIcon'
  }
])

// Character classes data
const classes = ref([
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'A mighty fighter skilled in melee combat and heavy armor',
    stats: { STR: 5, AGI: 2, INT: 1, VIT: 4, LUK: 2 }
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'A master of arcane arts wielding devastating magical spells',
    stats: { STR: 1, AGI: 2, INT: 5, VIT: 2, LUK: 4 }
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'A skilled archer and tracker, one with nature',
    stats: { STR: 3, AGI: 5, INT: 2, VIT: 3, LUK: 3 }
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'A stealthy assassin striking from the shadows',
    stats: { STR: 2, AGI: 5, INT: 3, VIT: 2, LUK: 4 }
  }
])

// News data
const news = ref([
  {
    id: 1,
    title: 'Major Update: The Dragon Awakens',
    excerpt: 'Ancient dragons have awakened across the realm, bringing new challenges and legendary rewards.',
    date: new Date('2024-01-15'),
    tags: ['Update', 'Dragons', 'Events']
  },
  {
    id: 2,
    title: 'PvP Season 3 Begins',
    excerpt: 'The third season of ranked PvP has started with new arenas and exclusive rewards.',
    date: new Date('2024-01-10'),
    tags: ['PvP', 'Season', 'Competitive']
  },
  {
    id: 3,
    title: 'Guild Wars Championship',
    excerpt: 'The annual Guild Wars tournament is now open for registration. Glory awaits!',
    date: new Date('2024-01-05'),
    tags: ['Guilds', 'Tournament', 'Competition']
  }
])

// Format date helper
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Simple icon components
const WorldIcon = { template: '<div class="icon">🌍</div>' }
const SwordIcon = { template: '<div class="icon">⚔️</div>' }
const ShieldIcon = { template: '<div class="icon">🛡️</div>' }
const HammerIcon = { template: '<div class="icon">🔨</div>' }
const StarIcon = { template: '<div class="icon">⭐</div>' }
const TrophyIcon = { template: '<div class="icon">🏆</div>' }
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

/* Hero Section */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  padding: var(--spacing-xl);
}

.hero-logo {
  width: 150px;
  height: 150px;
  margin: 0 auto var(--spacing-lg);
}

.epic-logo {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 30px var(--accent-primary));
}

.epic-logo .animate-spin {
  animation: spin 8s linear infinite;
}

.epic-logo .animate-pulse {
  animation: pulse 3s ease-in-out infinite;
}

.hero-title {
  font-size: 4rem;
  font-weight: var(--font-weight-black);
  font-family: 'Orbitron', monospace;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-md);
  text-shadow: 0 0 50px var(--accent-primary);
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-xxl);
  flex-wrap: wrap;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xl);
  flex-wrap: wrap;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: var(--font-size-xxxl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  font-family: 'Orbitron', monospace;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.floating-orb {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
  border-radius: 50%;
  left: var(--x);
  top: var(--y);
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Sections */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-xxxl);
  font-weight: var(--font-weight-bold);
  text-align: center;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xxl);
  font-family: 'Orbitron', monospace;
}

/* Features Section */
.features {
  padding: var(--spacing-xxl) 0;
  background: rgba(22, 33, 62, 0.5);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.feature-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
  transition: all var(--transition-medium);
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: var(--accent-primary);
  box-shadow: 0 10px 30px var(--shadow-glow);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.feature-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Classes Section */
.classes {
  padding: var(--spacing-xxl) 0;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.class-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  text-align: center;
  transition: all var(--transition-medium);
}

.class-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent-primary);
  box-shadow: 0 8px 25px var(--shadow-heavy);
}

.class-image {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--spacing-md);
}

.class-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xxxl);
  font-weight: var(--font-weight-bold);
  color: white;
}

.class-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.class-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.class-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.class-stat {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  width: 30px;
  text-align: left;
}

.stat-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: var(--radius-sm);
  transition: width 0.5s ease;
}

/* News Section */
.news {
  padding: var(--spacing-xxl) 0;
  background: rgba(22, 33, 62, 0.3);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.news-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-medium);
}

.news-item:hover {
  transform: translateY(-2px);
  border-color: var(--accent-primary);
  box-shadow: 0 6px 20px var(--shadow-medium);
}

.news-date {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--spacing-sm);
}

.news-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.news-excerpt {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.news-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.news-tag {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.icon {
  font-size: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-stats {
    gap: var(--spacing-md);
  }
  
  .features-grid,
  .classes-grid,
  .news-grid {
    grid-template-columns: 1fr;
  }
  
  .container {
    padding: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-logo {
    width: 100px;
    height: 100px;
  }
  
  .section-title {
    font-size: var(--font-size-xxl);
  }
}
</style>