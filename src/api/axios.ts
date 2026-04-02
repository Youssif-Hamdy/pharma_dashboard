import axios from 'axios'
import { getStoredToken } from './authStorage'

const api = axios.create({
  baseURL: 'https://pharma-api-flame.vercel.app/api',
})

api.interceptors.request.use(config => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api