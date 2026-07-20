import { getAppErrorMessage } from './errorManager'

export type HttpStatusToastOptions = {
  enabled?: boolean
  fallbackMessage?: string
}

export const httpStatusMessagesVi: Record<number, string> = {
  400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  409: 'Dữ liệu đã tồn tại hoặc bị xung đột.',
  422: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
  500: 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.',
  502: 'Máy chủ phản hồi không hợp lệ. Vui lòng thử lại sau.',
  503: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
  504: 'Kết nối tới máy chủ quá thời gian. Vui lòng thử lại sau.',
}

export function getHttpStatus(error: unknown) {
  if (!error || typeof error !== 'object') return 0

  const errorObject = error as {
    status?: unknown
    httpStatus?: unknown
    response?: {
      status?: unknown
      data?: {
        httpStatus?: unknown
        statusCode?: unknown
      }
    }
  }

  return Number(
    errorObject.status ||
    errorObject.httpStatus ||
    errorObject.response?.status ||
    errorObject.response?.data?.httpStatus ||
    errorObject.response?.data?.statusCode ||
    0,
  )
}

export function getHttpStatusMessage(status: number) {
  return httpStatusMessagesVi[status] || ''
}

export function shouldToastHttpStatus(status: number, options?: HttpStatusToastOptions) {
  if (options?.enabled === false) return false
  if (options?.enabled === true) return true

  return status === 0 || status >= 500 || status === 429
}

export function getHttpErrorToastMessage(error: unknown, options?: HttpStatusToastOptions) {
  const status = getHttpStatus(error)
  const fallbackMessage =
    options?.fallbackMessage ||
    getHttpStatusMessage(status) ||
    'Đã xảy ra lỗi. Vui lòng thử lại.'

  return getAppErrorMessage(error, fallbackMessage)
}
