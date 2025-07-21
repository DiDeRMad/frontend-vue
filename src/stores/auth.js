import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const sessionExpiry = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const hasCharacter = computed(() => user.value?.character?.name)
  const isSessionValid = computed(() => {
    if (!sessionExpiry.value) return false
    return new Date() < new Date(sessionExpiry.value)
  })

  // Actions
  const login = async (credentials) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.post('/auth/login', credentials)
      const { token: authToken, player, expiresAt } = response.data

      // Store auth data
      token.value = authToken
      user.value = player
      sessionExpiry.value = expiresAt

      // Store in localStorage for persistence
      localStorage.setItem('auth_token', authToken)
      localStorage.setItem('user_data', JSON.stringify(player))
      localStorage.setItem('session_expiry', expiresAt)

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      console.log('🔐 User logged in successfully:', player.character.name)

      // Initialize socket connection
      if (window.initializeSocket) {
        window.initializeSocket()
      }

      return { success: true }

    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      console.error('❌ Login error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (registrationData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.post('/auth/register', registrationData)
      const { message } = response.data

      console.log('📝 User registered successfully')
      return { success: true, message }

    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      console.error('❌ Registration error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const createCharacter = async (characterData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.post('/auth/create-character', characterData)
      const { player } = response.data

      // Update user data with character info
      user.value = player
      localStorage.setItem('user_data', JSON.stringify(player))

      console.log('🧙 Character created successfully:', player.character.name)
      return { success: true, player }

    } catch (err) {
      error.value = err.response?.data?.message || 'Character creation failed'
      console.error('❌ Character creation error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token.value) {
        await axios.post('/auth/logout').catch(() => {
          // Ignore logout endpoint errors
        })
      }
    } catch (err) {
      console.warn('⚠️ Logout endpoint error:', err)
    } finally {
      // Clear all auth data
      clearAuthData()
      console.log('👋 User logged out')
    }
  }

  const clearAuthData = () => {
    user.value = null
    token.value = null
    sessionExpiry.value = null
    error.value = null

    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('session_expiry')

    // Clear axios header
    delete axios.defaults.headers.common['Authorization']

    // Disconnect socket if exists
    if (window.$socket) {
      window.$socket.disconnect()
      window.$socket = null
    }
  }

  const refreshToken = async () => {
    try {
      if (!token.value) return false

      const response = await axios.post('/auth/refresh')
      const { token: newToken, expiresAt } = response.data

      token.value = newToken
      sessionExpiry.value = expiresAt

      // Update localStorage
      localStorage.setItem('auth_token', newToken)
      localStorage.setItem('session_expiry', expiresAt)

      // Update axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      console.log('🔄 Token refreshed successfully')
      return true

    } catch (err) {
      console.error('❌ Token refresh failed:', err)
      logout() // Clear invalid session
      return false
    }
  }

  const validateSession = async () => {
    try {
      if (!token.value) return false

      const response = await axios.get('/auth/validate')
      const { valid, player } = response.data

      if (valid) {
        // Update user data if provided
        if (player) {
          user.value = player
          localStorage.setItem('user_data', JSON.stringify(player))
        }
        return true
      } else {
        clearAuthData()
        return false
      }

    } catch (err) {
      console.error('❌ Session validation failed:', err)
      clearAuthData()
      return false
    }
  }

  const initializeAuth = async () => {
    try {
      // Try to restore session from localStorage
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user_data')
      const storedExpiry = localStorage.getItem('session_expiry')

      if (!storedToken || !storedUser || !storedExpiry) {
        return false
      }

      // Check if session is still valid
      if (new Date() >= new Date(storedExpiry)) {
        clearAuthData()
        return false
      }

      // Restore auth state
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      sessionExpiry.value = storedExpiry

      // Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`

      // Validate session with server
      const isValid = await validateSession()
      
      if (isValid) {
        console.log('🔐 Session restored:', user.value.character.name)
        return true
      } else {
        return false
      }

    } catch (err) {
      console.error('❌ Auth initialization failed:', err)
      clearAuthData()
      return false
    }
  }

  const updateUserData = (newUserData) => {
    user.value = { ...user.value, ...newUserData }
    localStorage.setItem('user_data', JSON.stringify(user.value))
  }

  const requestPasswordReset = async (email) => {
    try {
      isLoading.value = true
      error.value = null

      await axios.post('/auth/forgot-password', { email })
      
      console.log('📧 Password reset email sent')
      return { success: true }

    } catch (err) {
      error.value = err.response?.data?.message || 'Password reset request failed'
      console.error('❌ Password reset error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (resetData) => {
    try {
      isLoading.value = true
      error.value = null

      await axios.post('/auth/reset-password', resetData)
      
      console.log('🔑 Password reset successfully')
      return { success: true }

    } catch (err) {
      error.value = err.response?.data?.message || 'Password reset failed'
      console.error('❌ Password reset error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const verifyEmail = async (verificationToken) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.post('/auth/verify-email', { token: verificationToken })
      
      // Update user data if email verification affects it
      if (response.data.player) {
        updateUserData(response.data.player)
      }

      console.log('✅ Email verified successfully')
      return { success: true }

    } catch (err) {
      error.value = err.response?.data?.message || 'Email verification failed'
      console.error('❌ Email verification error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const resendVerificationEmail = async () => {
    try {
      isLoading.value = true
      error.value = null

      await axios.post('/auth/resend-verification')
      
      console.log('📧 Verification email resent')
      return { success: true }

    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to resend verification email'
      console.error('❌ Resend verification error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (passwordData) => {
    try {
      isLoading.value = true
      error.value = null

      await axios.post('/auth/change-password', passwordData)
      
      console.log('🔑 Password changed successfully')
      return { success: true }

    } catch (err) {
      error.value = err.response?.data?.message || 'Password change failed'
      console.error('❌ Password change error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const deleteAccount = async (confirmationData) => {
    try {
      isLoading.value = true
      error.value = null

      await axios.delete('/auth/account', { data: confirmationData })
      
      // Clear auth data after successful deletion
      clearAuthData()
      
      console.log('🗑️ Account deleted successfully')
      return { success: true }

    } catch (err) {
      error.value = err.response?.data?.message || 'Account deletion failed'
      console.error('❌ Account deletion error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Auto-refresh token when close to expiry
  const setupTokenRefresh = () => {
    if (!isAuthenticated.value || !sessionExpiry.value) return

    const expiryTime = new Date(sessionExpiry.value).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000) // Refresh 5 minutes before expiry

    if (refreshTime > 0) {
      setTimeout(() => {
        refreshToken()
      }, refreshTime)
    }
  }

  // Setup auto-refresh if authenticated
  if (isAuthenticated.value) {
    setupTokenRefresh()
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    sessionExpiry,
    
    // Getters
    isAuthenticated,
    hasCharacter,
    isSessionValid,
    
    // Actions
    login,
    register,
    createCharacter,
    logout,
    clearAuthData,
    refreshToken,
    validateSession,
    initializeAuth,
    updateUserData,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    changePassword,
    deleteAccount,
    clearError,
    setupTokenRefresh
  }
})