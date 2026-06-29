import { useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error'

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

  const triggerToast = (message = "Password reset successful.", type: ToastType = 'success') => {
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

  return {
    showToast,
    toastFadeOut,
    toastMessage,
    toastType,
    triggerToast,
  }
}
