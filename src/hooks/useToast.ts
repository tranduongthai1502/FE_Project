import { useEffect, useRef, useState } from 'react'
import { getHttpErrorToastMessage, shouldToastHttpStatus, getHttpStatus, type HttpStatusToastOptions } from '@/utils/httpStatusManager'

export type ToastType = 'success' | 'error'
export type ToastOptions = {
  enabled?: boolean
}

export function useToast() {
  const [showToast, setShowToast] = useState(false)
  const [toastFadeOut, setToastFadeOut] = useState(false)
  const [toastMessage, setToastMessage] = useState("Password reset successful.")
  const [toastType, setToastType] = useState<ToastType>('success')
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)
    }
  }, [])

  const triggerToast = (message = "Password reset successfully.", type: ToastType = 'success', options?: ToastOptions) => {
    if (options?.enabled === false) return

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)

    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setToastFadeOut(false)

    toastFadeTimerRef.current = setTimeout(() => {
      setToastFadeOut(true)
    }, 3000)

    toastTimerRef.current = setTimeout(() => {
      setShowToast(false)
    }, 3400)
  }

  const triggerHttpErrorToast = (error: unknown, options?: HttpStatusToastOptions) => {
    const status = getHttpStatus(error)
    if (!shouldToastHttpStatus(status, options)) return

    triggerToast(getHttpErrorToastMessage(error, options), 'error')
  }

  return {
    showToast,
    toastFadeOut,
    toastMessage,
    toastType,
    triggerToast,
    triggerHttpErrorToast,
  }
}
