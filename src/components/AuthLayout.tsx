import type { ReactNode } from 'react'
import bgImg from '../assets/ai_recruitment_bg.png'

type AuthLayoutProps = {
  children: ReactNode
  isSignup?: boolean
}

export function AuthLayout({ children, isSignup = false }: AuthLayoutProps) {
  return (
    <main className={`login-page ${isSignup ? 'signup-page' : ''}`}>
      <section className="hero-panel" style={{ backgroundImage: `url(${bgImg})` }}>
        <div className="hero-card">
          <h1>
            Empowering your
            <br />
            recruitment with
            <br />
            Human-in-the-Loop AI
          </h1>
          <p>
            Seamlessly blending machine intelligence with human intuition to find your perfect candidate match, faster
            than ever.
          </p>
        </div>
      </section>

      <section className="form-panel">{children}</section>
    </main>
  )
}
