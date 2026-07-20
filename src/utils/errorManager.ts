export const errorMessagesVi: Record<string, string> = {
  email_already_exists: 'Email đã tồn tại. Vui lòng sử dụng email khác.',
  domain_already_exists: 'Tên miền đã tồn tại. Vui lòng sử dụng tên miền khác.',
  tenant_already_exists: 'Tenant đã tồn tại.',
  name_already_exists: 'Tên đã tồn tại. Vui lòng sử dụng tên khác.',
  user_not_found: 'Không tìm thấy người dùng.',
  invalid_token: 'Token không hợp lệ. Vui lòng đăng nhập lại.',
  wrong_email: 'Email không đúng.',
  wrong_password: 'Mật khẩu không đúng.',
  access_denied: 'Bạn không có quyền thực hiện thao tác này.',
  user_account_is_not_active: 'Tài khoản người dùng chưa được kích hoạt.',
  must_fill_number_or_choose_unlimited: 'Vui lòng nhập số hợp lệ hoặc chọn Không giới hạn.',
  an_unexpected_error_occured_please_try_again_later: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
  old_password_can_not_be_the_same_with_new_password: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
  otp_has_expired_please_request_a_new_one: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
  plan_not_found: 'Không tìm thấy gói đăng ký.',
  role_not_found: 'Không tìm thấy vai trò.',
  tenant_not_found: 'Không tìm thấy tenant.',
  plan_already_exists: 'Gói đăng ký đã tồn tại.',
  max_staff_limit_reached: 'Đã đạt giới hạn số lượng nhân sự.',
  staff_already_active_or_disabled: 'Tài khoản nhân sự đã ở trạng thái kích hoạt hoặc vô hiệu hóa.',
  invalid_request: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.',
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  unauthorized: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
}

function normalizeErrorKey(value: string) {
  return value.trim().toLowerCase()
}

function humanizeErrorCodeVi(code: string) {
  return code
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
}

export function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return ''

  const errorObject = error as {
    code?: unknown
    errorCode?: unknown
    response?: {
      data?: {
        code?: unknown
        errorCode?: unknown
        error?: unknown
        data?: {
          code?: unknown
          errorCode?: unknown
          error?: unknown
        }
      }
    }
  }

  return String(
    errorObject.code ||
    errorObject.errorCode ||
    errorObject.response?.data?.code ||
    errorObject.response?.data?.errorCode ||
    errorObject.response?.data?.data?.code ||
    errorObject.response?.data?.data?.errorCode ||
    errorObject.response?.data?.error ||
    errorObject.response?.data?.data?.error ||
    '',
  )
}

export function getErrorRawMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== 'object') return ''

  const errorObject = error as {
    message?: unknown
    response?: {
      data?: {
        message?: unknown
        error?: unknown
        code?: unknown
        data?: {
          message?: unknown
          error?: unknown
          code?: unknown
        }
      }
    }
  }

  return String(
    errorObject.response?.data?.message ||
    errorObject.response?.data?.error ||
    errorObject.response?.data?.code ||
    errorObject.response?.data?.data?.message ||
    errorObject.response?.data?.data?.error ||
    errorObject.response?.data?.data?.code ||
    errorObject.message ||
    '',
  )
}

export function translateErrorCode(value: string) {
  const key = normalizeErrorKey(value)
  return errorMessagesVi[key] || ''
}

export function getAppErrorMessage(error: unknown, fallbackMessage: string) {
  const code = getErrorCode(error)
  const rawMessage = getErrorRawMessage(error)
  const translatedCode = code ? translateErrorCode(code) : ''

  if (translatedCode) return translatedCode

  const normalizedMessage = rawMessage.trim()
  if (!normalizedMessage) return fallbackMessage

  const translatedMessage = translateErrorCode(normalizedMessage)
  if (translatedMessage) return translatedMessage

  if (/^[a-z][a-z0-9_-]+$/i.test(normalizedMessage)) {
    return `Lỗi: ${humanizeErrorCodeVi(normalizedMessage)}.`
  }

  return normalizedMessage
}
