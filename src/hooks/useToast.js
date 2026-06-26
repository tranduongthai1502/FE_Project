import { useEffect, useRef, useState } from 'react'

export function useToast() {
  const [showToast, setShowToast] = useState(false)
  const [toastFadeOut, setToastFadeOut] = useState(false)
  const [toastMessage, setToastMessage] = useState("Password reset successful.")
  const [toastType, setToastType] = useState("success") // 'success' | 'error'
  const toastTimerRef = useRef(null)
  const toastFadeTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)
    }
  }, [])

  const triggerToast = (message = "Password reset successful.", type = "success") => {
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
