import api from './axios'
import { setStoredToken, setStoredUser } from './authStorage'

export type AuthUser = {
  id: string
  email: string
  name?: string
  createdAt: string
}

type AuthData = {
  user: AuthUser
  token: string
}

type AuthApiEnvelope = {
  success: boolean
  data?: AuthData
  message?: string
}

export async function login(email: string, password: string): Promise<AuthData> {
  const { data } = await api.post<AuthApiEnvelope>('/auth/login', { email, password })
  if (!data.success || !data.data?.token) {
    throw new Error(data.message || 'فشل تسجيل الدخول')
  }
  setStoredToken(data.data.token)
  setStoredUser({
    id: data.data.user.id,
    email: data.data.user.email,
    name: data.data.user.name,
  })
  return data.data
}

export async function fetchMe(): Promise<AuthData> {
  const { data } = await api.get<AuthApiEnvelope>('/auth/me')
  if (!data.success || !data.data?.token) {
    throw new Error(data.message || 'جلسة غير صالحة')
  }
  setStoredToken(data.data.token)
  setStoredUser({
    id: data.data.user.id,
    email: data.data.user.email,
    name: data.data.user.name,
  })
  return data.data
}
