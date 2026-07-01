import type {
  ClipboardEvent,
  Dispatch,
  FormEventHandler,
  KeyboardEvent,
  MutableRefObject,
  SetStateAction,
} from 'react'

type OtpFormProps = {
  otp: string[]
  setOtp: Dispatch<SetStateAction<string[]>>
  otpError: string
  setOtpError: Dispatch<SetStateAction<string>>
  otpInputsRef: MutableRefObject<Array<HTMLInputElement | null>>
  countdown: number
  isLoading: boolean
  handleOtpChange: (element: HTMLInputElement, index: number) => void
  handleOtpKeyDown: (event: KeyboardEvent<HTMLInputElement>, index: number) => void
  handleOtpPaste: (event: ClipboardEvent<HTMLDivElement>) => void
  handleVerifyOtp: FormEventHandler<HTMLFormElement>
  handleBackToLogin: () => void
  startTimer: () => void
}

export function OtpForm({
  otp,
  setOtp,
  otpError,
  setOtpError,
  otpInputsRef,
  countdown,
  isLoading,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  handleVerifyOtp,
  handleBackToLogin,
  startTimer,
}: OtpFormProps) {
  return (
    <form onSubmit={handleVerifyOtp} noValidate className="auth-form-content">
      <div className="shield-icon-container">
        <i className="fa-solid fa-shield-halved"></i>
      </div>

      <h1 className="form-title" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '24px' }}>
        {otpError ? 'OTP Verification Error - Invalid' : 'Verify Your Email'}
      </h1>

      <p className="form-desc" style={{ textAlign: 'center', marginBottom: '28px' }}>
        We've sent a 6-digit code to your email.<br />Enter it below to continue.
      </p>

      <div className="form-group" style={{ textAlign: 'center' }}>
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
          <span className="error-text" style={{ display: 'block', margin: '8px 0 0', textAlign: 'center' }}>
            {otpError}
          </span>
        )}
      </div>

      <button type="submit" className="submit-btn" disabled={isLoading} style={{ marginTop: '8px' }}>
        {isLoading ? (
          <>
            <div className="spinner" aria-hidden="true" />
            <span>Verifying...</span>
          </>
        ) : (
          <span>Verify OTP</span>
        )}
      </button>

      <div className="resend-text" style={{ textAlign: 'center', marginTop: '20px' }}>
        Didn't receive the code? 
        <button 
          type="button" 
          className="resend-link"
          disabled={countdown > 0 || isLoading}
          onClick={() => {
            alert('Verification code resent successfully!');
            setOtp(['', '', '', '', '', '']);
            setOtpError('');
            startTimer();
          }}
        >
          Resend Code {countdown > 0 ? `(${countdown}s)` : ''}
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
