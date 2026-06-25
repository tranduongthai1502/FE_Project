import { useEffect, useRef, useState } from 'react'

export function useToast() {
  const [showToast, setShowToast] = useState(false)
  const [toastFadeOut, setToastFadeOut] = useState(false)
  const toastTimerRef = useRef(null)
  const toastFadeTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)
    }
  }, [])

  const triggerToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)

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
    triggerToast,
  }
}
