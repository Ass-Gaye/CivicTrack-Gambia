/// <reference types="vite/client" />
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * Centralized API client. All frontend API calls go through this instance so
 * the base URL is configurable via VITE_API_URL (never hardcoded localhost).
 *
 * Credentials are included so the HttpOnly session cookie is sent with
 * cross-origin requests to the API (required for officer endpoints).
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Do not log or attach tokens to outgoing requests explicitly; the session
  // is carried by the HttpOnly cookie managed by the browser.
  return config
})

export interface ApiError {
  code: string
  message: string
  issues?: Array<{ path: string; message: string }>
}

export class ApiRequestError extends Error {
  constructor(public status: number, public error: ApiError) {
    super(error.message || 'Request failed')
    this.name = 'ApiRequestError'
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const apiError: ApiError = error.response.data?.error || {
        code: 'ERROR',
        message: error.response.data?.message || error.message || 'Request failed',
      }
      return Promise.reject(new ApiRequestError(error.response.status, apiError))
    }
    return Promise.reject(error)
  }
)
