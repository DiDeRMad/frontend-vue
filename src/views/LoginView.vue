<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <div class="login-logo">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" stroke="currentColor" stroke-width="2" fill="url(#logoGradient)"/>
              <path d="M22 22l16 8-16 8v-16z" fill="currentColor"/>
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--accent-primary);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:var(--accent-secondary);stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="login-title">Welcome Back</h1>
          <p class="login-subtitle">Enter the realm of Epic Adventure</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">
              <i class="icon-user"></i>
              Username or Email
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="form-input"
              placeholder="Enter your username or email"
              required
              :disabled="isLoading"
              autocomplete="username"
            />
            <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              <i class="icon-lock"></i>
              Password
            </label>
            <div class="password-input-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="Enter your password"
                required
                :disabled="isLoading"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="password-toggle"
                @click="togglePassword"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                <i :class="showPassword ? 'icon-eye-off' : 'icon-eye'"></i>
              </button>
            </div>
            <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
          </div>

          <div class="form-options">
            <label class="checkbox-wrapper">
              <input
                v-model="form.rememberMe"
                type="checkbox"
                class="checkbox-input"
                :disabled="isLoading"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">Remember me</span>
            </label>

            <router-link to="/forgot-password" class="forgot-link">
              Forgot password?
            </router-link>
          </div>

          <button
            type="submit"
            class="login-button"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading" class="button-loading">
              <i class="icon-loader"></i>
              Signing in...
            </span>
            <span v-else>
              <i class="icon-log-in"></i>
              Sign In
            </span>
          </button>

          <div v-if="error" class="login-error">
            <i class="icon-alert-circle"></i>
            {{ error }}
          </div>
        </form>

        <!-- Footer -->
        <div class="login-footer">
          <p class="signup-prompt">
            New to Epic Adventure?
            <router-link to="/register" class="signup-link">Create Account</router-link>
          </p>
          
          <div class="social-login">
            <p class="social-prompt">Or continue with</p>
            <div class="social-buttons">
              <button class="social-button social-google" @click="loginWithGoogle" :disabled="isLoading">
                <i class="icon-google"></i>
                Google
              </button>
              <button class="social-button social-discord" @click="loginWithDiscord" :disabled="isLoading">
                <i class="icon-discord"></i>
                Discord
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Background Animation -->
      <div class="login-background">
        <div class="floating-orb" v-for="i in 6" :key="i" :style="getOrbStyle(i)"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

// Router
const router = useRouter()

// Stores
const authStore = useAuthStore()
const uiStore = useUIStore()

// Store state
const { isAuthenticated } = storeToRefs(authStore)

// Component state
const form = ref({
  username: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const errors = ref({})

// Computed
const isFormValid = computed(() => {
  return form.value.username.trim().length > 0 && form.value.password.length > 0
})

// Methods
const handleLogin = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  error.value = ''
  errors.value = {}

  try {
    const result = await authStore.login({
      username: form.value.username,
      password: form.value.password,
      rememberMe: form.value.rememberMe
    })

    if (result.success) {
      uiStore.showSuccess('Welcome back!', 'Login Successful')
      
      // Redirect to appropriate page
      const redirectTo = router.currentRoute.value.query.redirect || 
        (authStore.hasCharacter ? '/game/world' : '/character-creation')
      
      router.push(redirectTo)
    } else {
      error.value = result.error || 'Login failed. Please try again.'
      
      // Handle specific field errors
      if (result.fieldErrors) {
        errors.value = result.fieldErrors
      }
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const loginWithGoogle = async () => {
  if (isLoading.value) return
  
  uiStore.showInfo('Google login coming soon!', 'Feature Unavailable')
  // TODO: Implement Google OAuth
}

const loginWithDiscord = async () => {
  if (isLoading.value) return
  
  uiStore.showInfo('Discord login coming soon!', 'Feature Unavailable')
  // TODO: Implement Discord OAuth
}

const getOrbStyle = (index) => {
  const positions = [
    { left: '10%', top: '20%', animationDelay: '0s' },
    { left: '80%', top: '10%', animationDelay: '2s' },
    { left: '15%', top: '80%', animationDelay: '4s' },
    { left: '85%', top: '70%', animationDelay: '1s' },
    { left: '50%', top: '5%', animationDelay: '3s' },
    { left: '5%', top: '50%', animationDelay: '5s' }
  ]
  
  return positions[index - 1] || {}
}

const validateForm = () => {
  const newErrors = {}
  
  if (!form.value.username.trim()) {
    newErrors.username = 'Username or email is required'
  }
  
  if (!form.value.password) {
    newErrors.password = 'Password is required'
  } else if (form.value.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Lifecycle
onMounted(() => {
  // If already authenticated, redirect
  if (isAuthenticated.value) {
    const redirectTo = authStore.hasCharacter ? '/game/world' : '/character-creation'
    router.push(redirectTo)
  }
})
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%);
  position: relative;
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-lg);
}

.login-card {
  background: rgba(var(--bg-primary-rgb), 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-2xl);
  padding: var(--spacing-2xl);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.login-logo {
  margin-bottom: var(--spacing-md);
  color: var(--accent-primary);
}

.login-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.login-form {
  margin-bottom: var(--spacing-xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all var(--transition-duration);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius);
  transition: all var(--transition-duration);
}

.password-toggle:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.form-error {
  display: block;
  color: var(--accent-danger);
  font-size: 0.8rem;
  margin-top: var(--spacing-xs);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 3px;
  position: relative;
  transition: all var(--transition-duration);
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
}

.checkbox-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.forgot-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color var(--transition-duration);
}

.forgot-link:hover {
  color: var(--accent-primary-dark);
}

.login-button {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border: none;
  border-radius: var(--border-radius);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-duration);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-loading .icon-loader {
  animation: spin 1s linear infinite;
}

.login-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--accent-danger);
  background: rgba(var(--accent-danger-rgb), 0.1);
  border: 1px solid rgba(var(--accent-danger-rgb), 0.2);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-md);
  font-size: 0.9rem;
}

.login-footer {
  text-align: center;
}

.signup-prompt {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: 0.9rem;
}

.signup-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-duration);
}

.signup-link:hover {
  color: var(--accent-primary-dark);
}

.social-login {
  margin-top: var(--spacing-lg);
}

.social-prompt {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin: 0 0 var(--spacing-md) 0;
  position: relative;
}

.social-prompt::before,
.social-prompt::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: var(--border-color);
}

.social-prompt::before {
  left: 0;
}

.social-prompt::after {
  right: 0;
}

.social-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.social-button {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-duration);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.social-button:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.social-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.social-google:hover:not(:disabled) {
  border-color: #4285f4;
  color: #4285f4;
}

.social-discord:hover:not(:disabled) {
  border-color: #5865f2;
  color: #5865f2;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

.floating-orb {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(var(--accent-primary-rgb), 0.3), rgba(var(--accent-secondary-rgb), 0.1));
  animation: float 10s ease-in-out infinite;
  filter: blur(40px);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: var(--spacing-md);
  }
  
  .login-card {
    padding: var(--spacing-lg);
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .social-buttons {
    flex-direction: column;
  }
}
</style>