import { describe, expect, it } from 'vitest'
import { resolveApiBaseUrl } from '../src/core/api/axiosClient'

describe('resolveApiBaseUrl', () => {
  it('uses the configured backend URL when provided', () => {
    expect(resolveApiBaseUrl('https://api.example.com')).toBe('https://api.example.com')
  })

  it('falls back to localhost when no backend URL is configured', () => {
    expect(resolveApiBaseUrl('')).toBe('http://localhost:8080')
    expect(resolveApiBaseUrl(undefined)).toBe('http://localhost:8080')
  })
})
