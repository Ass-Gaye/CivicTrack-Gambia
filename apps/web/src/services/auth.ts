import { api, ApiRequestError } from '@/lib/api'
import type { AuthUser } from '@/types'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResult {
  user: AuthUser
  message: string
}

export async function login(data: LoginInput): Promise<LoginResult> {
  const res = await api.post<{ data: LoginResult }>('/api/auth/login', data)
  return res.data.data
}

export async function logout(): Promise<{ ok: boolean; message: string }> {
  const res = await api.post<{ data: { ok: boolean; message: string } }>('/api/auth/logout')
  return res.data.data
}

export async function getSession(): Promise<{ user: AuthUser }> {
  const res = await api.get<{ data: { user: AuthUser } }>('/api/auth/me')
  return res.data.data
}

export { ApiRequestError }
