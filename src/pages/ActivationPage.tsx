import { useEffect, useState, useRef, FormEvent } from 'react'
import { useSearchParams, NavigateFunction } from 'react-router-dom'
import { authApi } from '@/features/auth/services/authApi'

type ActivationStatus = 'loading' | 'verified' | 'success' | 'error'

type ActivationDetails = {
  workspaceName?: string
  role?: string
  email?: string
}

type ActivationPageProps = {
  navigate: NavigateFunction
  onSignInSuccess: (email: string, keepLoggedIn: boolean, userRole: string) => boolean
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

// Helpers để trích xuất role tương tự như trong LoginFeature
function normalizeRoleValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeRoleValue(item))
  }

  if (value && typeof value === 'object') {
    const roleObject = value as Record<string, unknown>
    return normalizeRoleValue(
      roleObject.role ||
        roleObject.name ||
        roleObject.roleName ||
        roleObject.role_name ||
        roleObject.authority ||
        roleObject.authorities ||
        roleObject.userRole ||
        roleObject.user_role,
    )
  }

  return String(value || '')
    .split(/[,;/|]+/)
    .map((role) => role.trim())
    .filter(Boolean)
}

function getAuthUserRole(user: any, payload: any) {
  const primaryRoleValues = [
    user?.role,
    user?.userRole,
    user?.user_role,
    user?.type,
    payload?.role,
    payload?.userRole,
    payload?.user_role,
    payload?.type,
  ].flatMap((value) => normalizeRoleValue(value))

  if (primaryRoleValues.length > 0) {
    return primaryRoleValues.join(',')
  }

  const multiRoleValues = [
    user?.roles,
    user?.userRoles,
    user?.authorities,
    payload?.roles,
    payload?.userRoles,
    payload?.authorities,
  ].flatMap((value) => normalizeRoleValue(value))

  return multiRoleValues.join(',')
}

export function ActivationPage({ navigate, onSignInSuccess, triggerToast }: ActivationPageProps) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<ActivationStatus>('loading')
  const [message, setMessage] = useState('Hệ thống đang xác thực liên kết kích hoạt của bạn. Vui lòng đợi trong giây lát...')
  const [activationDetails, setActivationDetails] = useState<ActivationDetails | null>(null)
  
  // State phục vụ Resend
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  
  // State phục vụ Kích hoạt
  const [isActivating, setIsActivating] = useState(false)

  const hasCalledApi = useRef(false)

  useEffect(() => {
    if (hasCalledApi.current) return
    hasCalledApi.current = true

    if (!token) {
      setStatus('error')
      setMessage('Liên kết kích hoạt không hợp lệ. Không tìm thấy mã xác thực token.')
      return
    }

    const fetchDetails = async () => {
      try {
        const response: any = await authApi.activate(token)
        const payload = response?.data && typeof response.data === 'object' ? response.data : response
        
        // Lưu thông tin chi tiết kích hoạt
        setActivationDetails({
          workspaceName: payload?.workspaceName || payload?.companyName || payload?.tenantName || 'JobFusion Workspace',
          role: payload?.role || payload?.roleName || 'Staff Member',
          email: payload?.email || payload?.username || '',
        })
        
        setStatus('verified')
        setMessage('Xác nhận thông tin lời mời của bạn dưới đây và click nút để kích hoạt tài khoản của bạn.')
      } catch (error: any) {
        setStatus('error')
        const errorMsg = error?.message || 'Mã kích hoạt không hợp lệ, đã được sử dụng hoặc đã hết hạn.'
        setMessage(errorMsg)
        triggerToast?.(errorMsg, 'error')
      }
    }

    fetchDetails()
  }, [token, triggerToast])

  const handleActivateClick = async () => {
    if (!token) return

    setIsActivating(true)
    try {
      const response: any = await authApi.confirmActivation(token)
      const payload = response?.data && typeof response.data === 'object' ? response.data : response
      
      const tokenVal = payload?.token || payload?.access_token || payload?.accessToken || payload?.jwt || ''
      const refreshToken = payload?.refresh_token || payload?.refreshToken || ''
      const user = payload?.user || payload?.user_info || payload?.userInfo || null
      const userRole = getAuthUserRole(user, payload)
      const emailVal = user?.email || activationDetails?.email || ''

      // Lưu trữ tokens vào Storage tương tự luồng Login
      const storage = window.localStorage
      window.sessionStorage.removeItem('access_token')
      window.sessionStorage.removeItem('refresh_token')
      window.sessionStorage.removeItem('user_info')

      if (tokenVal) {
        storage.setItem('access_token', tokenVal)
      }
      if (refreshToken) {
        storage.setItem('refresh_token', refreshToken)
      }
      if (user) {
        storage.setItem('user_info', JSON.stringify(user))
      }

      setStatus('success')
      setMessage('Tài khoản của bạn đã được kích hoạt thành công! Hệ thống đang chuyển hướng tới Dashboard...')
      triggerToast?.('Kích hoạt và đăng nhập thành công!', 'success')

      // Gọi onSignInSuccess để tự động định tuyến về Dashboard thích hợp
      setTimeout(() => {
        onSignInSuccess(emailVal, true, userRole)
      }, 1500)

    } catch (error: any) {
      const errorMsg = error?.message || 'Kích hoạt tài khoản thất bại. Vui lòng thử lại.'
      triggerToast?.(errorMsg, 'error')
    } finally {
      setIsActivating(false)
    }
  }

  const handleResend = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      triggerToast?.('Vui lòng nhập địa chỉ email!', 'error')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      triggerToast?.('Địa chỉ email không đúng định dạng!', 'error')
      return
    }

    setIsResending(true)
    try {
      await authApi.resendActivation(email)
      triggerToast?.('Yêu cầu gửi lại liên kết thành công! Vui lòng kiểm tra email của bạn.', 'success')
      setEmail('')
    } catch (error: any) {
      const errorMsg = error?.message || 'Có lỗi xảy ra khi gửi lại yêu cầu kích hoạt.'
      triggerToast?.(errorMsg, 'error')
    } finally {
      setIsResending(false)
    }
  }

  const handleGoToLogin = () => {
    navigate('/login', { replace: true })
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return 'fa-solid fa-spinner fa-spin'
      case 'verified':
        return 'fa-regular fa-envelope'
      case 'success':
        return 'fa-solid fa-circle-check text-success'
      case 'error':
        return 'fa-solid fa-circle-xmark text-danger'
    }
  }

  return (
    <main className="tenant-activation-page">
      <section className="tenant-activation-shell" aria-labelledby="tenant-activation-title">
        <div className={`tenant-activation-badge ${status}`}>
          <i className={getStatusIcon()} style={{ fontSize: '2.5rem' }}></i>
        </div>

        <div className="tenant-activation-copy">
          <span>Hệ thống JobFusion</span>
          <h2 id="tenant-activation-title">
            {status === 'loading' && 'Đang xác thực liên kết'}
            {status === 'verified' && 'Xác thực lời mời làm việc'}
            {status === 'success' && 'Kích hoạt thành công'}
            {status === 'error' && 'Kích hoạt thất bại'}
          </h2>
          <p>{message}</p>
        </div>

        {status === 'verified' && activationDetails && (
          <div className="tenant-activation-summary">
            <div>
              <small>Workspace / Doanh nghiệp</small>
              <strong>{activationDetails.workspaceName}</strong>
            </div>
            <div>
              <small>Vai trò</small>
              <strong>{activationDetails.role}</strong>
            </div>
            <div>
              <small>Địa chỉ Email</small>
              <strong>{activationDetails.email}</strong>
            </div>
          </div>
        )}

        {status === 'verified' && (
          <button
            type="button"
            className="tenant-activation-button"
            onClick={handleActivateClick}
            disabled={isActivating}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%' }}
          >
            {isActivating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Đang kích hoạt...
              </>
            ) : (
              'Active Account'
            )}
          </button>
        )}

        {status === 'error' && (
          <form onSubmit={handleResend} style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label htmlFor="resend-email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                Nhập Email để nhận lại liên kết:
              </label>
              <input
                id="resend-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #ccc)',
                  backgroundColor: 'var(--bg-input, #fff)',
                  color: 'var(--text-main, #333)',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                disabled={isResending}
              />
            </div>
            <button
              type="submit"
              className="tenant-activation-button"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Đang gửi...
                </>
              ) : (
                'Gửi lại yêu cầu kích hoạt'
              )}
            </button>
          </form>
        )}

        {status === 'error' && (
          <button type="button" className="tenant-activation-secondary" onClick={handleGoToLogin} style={{ width: '100%', marginTop: '0.5rem' }}>
            Quay lại trang Đăng nhập
          </button>
        )}
      </section>
    </main>
  )
}
