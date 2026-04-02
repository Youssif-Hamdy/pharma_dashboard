const AUTH_TOKEN_KEY = 'pharma_auth_token'
const AUTH_USER_KEY = 'pharma_auth_user'

export type StoredUser = {
  id: string
  email: string
  name?: string
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  }
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function setStoredUser(user: StoredUser | null): void {
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(AUTH_USER_KEY)
}
