import type {
  ClipboardEvent,
  FormEventHandler,
  KeyboardEvent,
  MutableRefObject,
} from 'react'

type OtpFormProps = {
  otp: string[]
  otpError: string
  otpInputsRef: MutableRefObject<Array<HTMLInputElement | null>>
  countdown: number
  isLoading: boolean
  handleOtpChange: (element: HTMLInputElement, index: number) => void
  handleOtpKeyDown: (event: KeyboardEvent<HTMLInputElement>, index: number) => void
  handleOtpPaste: (event: ClipboardEvent<HTMLDivElement>) => void
  handleVerifyOtp: FormEventHandler<HTMLFormElement>
  handleBackToLogin: () => void
  handleResendCode: () => void
  isResendingCode: boolean
}

export function OtpForm({
  otp,
  otpError,
  otpInputsRef,
  countdown,
  isLoading,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  handleVerifyOtp,
  handleBackToLogin,
  handleResendCode,
  isResendingCode,
}: OtpFormProps) {
  return (
    <form onSubmit={handleVerifyOtp} noValidate className="auth-form-content">
      <div className="shield-icon-container">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 6L10 15v17c0 14.7 9.4 25.4 22 30 12.6-4.6 22-15.3 22-30V15L32 6z" />
          <path d="M23.7 31.5l5.7 5.7 12.1-13.1" />
        </svg>
      </div>

      <h1 className="form-title">Verify Your Email</h1>

      <p className="form-desc">
        We've sent a 6-digit code to your email.<br />Enter it below to continue.
      </p>

      <div className="form-group otp-group">
        <div className="otp-container" onPaste={handleOtpPaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              className={`otp-input ${otpError ? 'has-error' : ''}`}
              value={digit}
              ref={(el) => {
                otpInputsRef.current[idx] = el
              }}
              onChange={(e) => handleOtpChange(e.target, idx)}
              onKeyDown={(e) => handleOtpKeyDown(e, idx)}
              disabled={isLoading}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          ))}
        </div>
        {otpError && (
          <span className="error-text otp-error-text">
            {otpError}
          </span>
        )}
      </div>

      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="spinner" aria-hidden="true" />
            <span>Verifying...</span>
          </>
        ) : (
          <span>Verify OTP</span>
        )}
      </button>

      <div className="resend-text">
        Didn't receive the code?  
        <button 
          type="button" 
          className="resend-link"
          disabled={countdown > 0 || isLoading || isResendingCode}
          onClick={handleResendCode}
        >
          {isResendingCode ? 'Resending...' : `Resend Code ${countdown > 0 ? `(${countdown}s)` : ''}`}
        </button>
      </div>

      <div className="divider"></div>

      <div className="form-footer">
        <button 
          type="button" 
          className="footer-back-link" 
          onClick={handleBackToLogin}
          disabled={isLoading}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to Login</span>
        </button>
      </div>
    </form>
  )
}
