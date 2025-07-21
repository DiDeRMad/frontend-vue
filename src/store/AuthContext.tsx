import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, ApiResponse, LoginRequest, RegisterRequest } from '@types'
import { authService } from '@services/authService'
import { storageService } from '@services/storageService'
import { notificationService } from '@services/notificationService'

// ==================== ТИПЫ ====================

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  permissions: string[]
  twoFactorRequired: boolean
  verificationRequired: boolean
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string; permissions: string[] } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_TWO_FACTOR_REQUIRED' }
  | { type: 'AUTH_VERIFICATION_REQUIRED' }
  | { type: 'AUTH_UPDATE_USER'; payload: User }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_REFRESH_TOKEN'; payload: { token: string } }

interface AuthContextType {
  // Состояние
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  permissions: string[]
  twoFactorRequired: boolean
  verificationRequired: boolean
  
  // Методы
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  clearError: () => void
  verifyTwoFactor: (code: string) => Promise<void>
  resendVerification: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

// ==================== НАЧАЛЬНОЕ СОСТОЯНИЕ ====================

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  permissions: [],
  twoFactorRequired: false,
  verificationRequired: false,
}

// ==================== REDUCER ====================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
        twoFactorRequired: false,
        verificationRequired: false,
      }

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        permissions: action.payload.permissions,
        error: null,
        twoFactorRequired: false,
        verificationRequired: false,
      }

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        twoFactorRequired: false,
        verificationRequired: false,
      }

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      }

    case 'AUTH_TWO_FACTOR_REQUIRED':
      return {
        ...state,
        isLoading: false,
        twoFactorRequired: true,
        error: null,
      }

    case 'AUTH_VERIFICATION_REQUIRED':
      return {
        ...state,
        isLoading: false,
        verificationRequired: true,
        error: null,
      }

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      }

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    case 'AUTH_REFRESH_TOKEN':
      return {
        ...state,
        token: action.payload.token,
      }

    default:
      return state
  }
}

// ==================== КОНТЕКСТ ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ==================== ПРОВАЙДЕР ====================

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // ==================== ЭФФЕКТЫ ====================

  // Инициализация при загрузке
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'AUTH_LOADING' })

      try {
        // Пытаемся восстановить сессию из localStorage
        const token = storageService.getItem('authToken')
        const refreshToken = storageService.getItem('refreshToken')
        const user = storageService.getItem('user')

        if (token && refreshToken && user) {
          // Проверяем валидность токена
          const isValid = await authService.validateToken(token)
          
          if (isValid) {
            // Получаем актуальные данные пользователя
            const response = await authService.getCurrentUser()
            
            if (response.success && response.data) {
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                  user: response.data.user,
                  token,
                  refreshToken,
                  permissions: response.data.permissions || [],
                },
              })
              
              // Обновляем данные в localStorage
              storageService.setItem('user', response.data.user)
              
              console.log('✅ Сессия восстановлена')
            } else {
              throw new Error('Не удалось получить данные пользователя')
            }
          } else {
            // Пытаемся обновить токен
            await refreshTokenInternal()
          }
        } else {
          // Нет сохраненной сессии
          dispatch({ type: 'AUTH_LOGOUT' })
        }
      } catch (error) {
        console.warn('⚠️ Ошибка инициализации аутентификации:', error)
        dispatch({ type: 'AUTH_LOGOUT' })
        clearStoredAuth()
      }
    }

    initializeAuth()
  }, [])

  // Автоматическое обновление токена
  useEffect(() => {
    if (!state.token || !state.refreshToken) return

    const refreshInterval = setInterval(async () => {
      try {
        await refreshTokenInternal()
      } catch (error) {
        console.error('❌ Ошибка автообновления токена:', error)
        await logout()
      }
    }, 15 * 60 * 1000) // Обновляем каждые 15 минут

    return () => clearInterval(refreshInterval)
  }, [state.token, state.refreshToken])

  // ==================== ВНУТРЕННИЕ МЕТОДЫ ====================

  const saveAuthData = (user: User, token: string, refreshToken: string, permissions: string[]) => {
    storageService.setItem('user', user)
    storageService.setItem('authToken', token)
    storageService.setItem('refreshToken', refreshToken)
    storageService.setItem('permissions', permissions)
  }

  const clearStoredAuth = () => {
    storageService.removeItem('user')
    storageService.removeItem('authToken')
    storageService.removeItem('refreshToken')
    storageService.removeItem('permissions')
  }

  const refreshTokenInternal = async () => {
    if (!state.refreshToken) {
      throw new Error('Нет refresh token')
    }

    const response = await authService.refreshToken(state.refreshToken)
    
    if (response.success && response.data) {
      dispatch({
        type: 'AUTH_REFRESH_TOKEN',
        payload: { token: response.data.token },
      })
      
      storageService.setItem('authToken', response.data.token)
    } else {
      throw new Error(response.error?.message || 'Ошибка обновления токена')
    }
  }

  // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: 'AUTH_LOADING' })

    try {
      const response = await authService.login(credentials)

      if (response.success && response.data) {
        // Проверяем, требуется ли двухфакторная аутентификация
        if (response.data.twoFactorRequired) {
          dispatch({ type: 'AUTH_TWO_FACTOR_REQUIRED' })
          return
        }

        // Успешная аутентификация
        const { user, token, refreshToken, permissions } = response.data
        
        saveAuthData(user, token, refreshToken, permissions)
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token, refreshToken, permissions },
        })

        notificationService.showSuccess('Добро пожаловать в ETERNAL REALMS!')
        
        // Логируем событие входа
        console.log(`🎮 Пользователь ${user.username} вошел в игру`)
      } else {
        throw new Error(response.error?.message || 'Ошибка входа')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла ошибка при входе'
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      notificationService.showError(errorMessage)
      throw error
    }
  }

  const register = async (data: RegisterRequest): Promise<void> => {
    dispatch({ type: 'AUTH_LOADING' })

    try {
      const response = await authService.register(data)

      if (response.success && response.data) {
        // Проверяем, требуется ли верификация
        if (response.data.verification.required) {
          dispatch({ type: 'AUTH_VERIFICATION_REQUIRED' })
          notificationService.showInfo(
            `Проверьте ${response.data.verification.method === 'email' ? 'почту' : 'телефон'} для подтверждения аккаунта`
          )
        } else {
          // Автоматический вход после регистрации
          await login({
            username: data.username,
            password: data.password,
            rememberMe: true,
          })
        }
      } else {
        throw new Error(response.error?.message || 'Ошибка регистрации')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла ошибка при регистрации'
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      notificationService.showError(errorMessage)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Уведомляем сервер о выходе
      if (state.token) {
        await authService.logout()
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при выходе с сервера:', error)
    } finally {
      // Очищаем локальные данные в любом случае
      clearStoredAuth()
      dispatch({ type: 'AUTH_LOGOUT' })
      notificationService.showInfo('Вы вышли из игры')
      
      console.log('👋 Пользователь вышел из игры')
    }
  }

  const refreshToken = async (): Promise<void> => {
    await refreshTokenInternal()
  }

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!state.user) {
      throw new Error('Нет активного пользователя')
    }

    try {
      const response = await authService.updateProfile(updates)

      if (response.success && response.data) {
        const updatedUser = { ...state.user, ...response.data }
        
        dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser })
        storageService.setItem('user', updatedUser)
        
        notificationService.showSuccess('Профиль обновлен')
      } else {
        throw new Error(response.error?.message || 'Ошибка обновления профиля')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла ошибка при обновлении профиля'
      notificationService.showError(errorMessage)
      throw error
    }
  }

  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  const verifyTwoFactor = async (code: string): Promise<void> => {
    dispatch({ type: 'AUTH_LOADING' })

    try {
      const response = await authService.verifyTwoFactor(code)

      if (response.success && response.data) {
        const { user, token, refreshToken, permissions } = response.data
        
        saveAuthData(user, token, refreshToken, permissions)
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token, refreshToken, permissions },
        })

        notificationService.showSuccess('Двухфакторная аутентификация пройдена')
      } else {
        throw new Error(response.error?.message || 'Неверный код')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Ошибка верификации'
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      notificationService.showError(errorMessage)
      throw error
    }
  }

  const resendVerification = async (): Promise<void> => {
    try {
      const response = await authService.resendVerification()

      if (response.success) {
        notificationService.showSuccess('Код верификации отправлен повторно')
      } else {
        throw new Error(response.error?.message || 'Ошибка отправки кода')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла ошибка'
      notificationService.showError(errorMessage)
      throw error
    }
  }

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const response = await authService.forgotPassword(email)

      if (response.success) {
        notificationService.showSuccess('Инструкции по восстановлению пароля отправлены на почту')
      } else {
        throw new Error(response.error?.message || 'Ошибка восстановления пароля')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла ошибка'
      notificationService.showError(errorMessage)
      throw error
    }
  }

  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      const response = await authService.resetPassword(token, password)

      if (response.success) {
        notificationService.showSuccess('Пароль успешно изменен')
      } else {
        throw new Error(response.error?.message || 'Ошибка сброса пароля')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла ошибка'
      notificationService.showError(errorMessage)
      throw error
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword)

      if (response.success) {
        notificationService.showSuccess('Пароль успешно изменен')
      } else {
        throw new Error(response.error?.message || 'Ошибка изменения пароля')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла ошибка'
      notificationService.showError(errorMessage)
      throw error
    }
  }

  // ==================== ПРОВЕРКА РАЗРЕШЕНИЙ ====================

  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission) || state.permissions.includes('*')
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // ==================== ЗНАЧЕНИЕ КОНТЕКСТА ====================

  const contextValue: AuthContextType = {
    // Состояние
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    permissions: state.permissions,
    twoFactorRequired: state.twoFactorRequired,
    verificationRequired: state.verificationRequired,
    
    // Методы
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,
    verifyTwoFactor,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// ==================== ХУКИ ====================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  
  return context
}

// Хук для проверки авторизации
export const useAuthRequired = (): AuthContextType => {
  const auth = useAuth()
  
  if (!auth.isAuthenticated) {
    throw new Error('Требуется авторизация')
  }
  
  return auth
}

// Хук для проверки разрешений
export const usePermission = (permission: string): boolean => {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}

export const usePermissions = (permissions: string[], requireAll = false): boolean => {
  const { hasAnyPermission, hasAllPermissions } = useAuth()
  return requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
}

export default AuthContext