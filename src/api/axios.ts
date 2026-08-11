import axios from 'axios'
import { getStoredToken, setStoredToken, getStoredRefreshToken, setStoredRefreshToken } from './authStorage'

const api = axios.create({
  baseURL: 'https://pharma-api-flame.vercel.app/api',
})

// ✅ Request interceptor: attach token to every request
api.interceptors.request.use(config => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Variables for handling concurrent token refreshes
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// ✅ Response interceptor: handle 401, refresh token, retry request
api.interceptors.response.use(
  response => response,
  error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = getStoredRefreshToken()

      if (!refreshToken) {
        setStoredToken(null) // This also clears refresh token in our updated storage
        window.location.href = '/login'
        return Promise.reject(error)
      }

      return new Promise(function(resolve, reject) {
        // Use standard axios to avoid recursive interceptor loops
        axios.post('https://pharma-api-flame.vercel.app/api/admin/auth/refresh', { refreshToken })
          .then(({ data }) => {
            if (data.success && data.data) {
              const newToken = data.data.token
              const newRefreshToken = data.data.refreshToken
              
              setStoredToken(newToken)
              setStoredRefreshToken(newRefreshToken)
              
              api.defaults.headers.common.Authorization = 'Bearer ' + newToken
              originalRequest.headers.Authorization = 'Bearer ' + newToken
              
              processQueue(null, newToken)
              resolve(api(originalRequest))
            } else {
              throw new Error("Refresh token returned false success")
            }
          })
          .catch(err => {
            processQueue(err, null)
            setStoredToken(null)
            window.location.href = '/login'
            reject(err)
          })
          .finally(() => {
            isRefreshing = false
          })
      })
    }

    return Promise.reject(error)
  }
)

export default api