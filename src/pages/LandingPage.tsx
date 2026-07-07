import heroBackground from '../assets/ai_recruitment_bg.png'

type LandingPageProps = {
  onGoToLogin: () => void
  onGoToSignup: () => void
}

const features = [
  {
    icon: 'JD',
    title: 'AI JD Generator',
    text: 'Enter keywords and AI creates a professional job description with an automated scoring rubric.',
    tone: 'orange',
  },
  {
    icon: 'CV',
    title: 'CV Parsing & Matching',
    text: 'Extract resume data from PDF or Word files into JSON, score fit, and suggest improvements.',
    tone: 'gold',
  },
  {
    icon: 'AI',
    title: 'AI Interview Chatbot',
    text: 'Run intelligent pre-screening conversations, collect extra details, and enrich each candidate profile.',
    tone: 'red',
  },
  {
    icon: 'KB',
    title: 'Kanban & Workflow',
    text: 'Manage your hiring funnel with drag-and-drop boards and real-time candidate status tracking.',
    tone: 'yellow',
  },
  {
    icon: 'EM',
    title: 'Automated Email',
    text: 'Use AI to draft personalized emails, send interview invitations, and deliver result notifications.',
    tone: 'pink',
  },
  {
    icon: 'DS',
    title: 'AI Analytics & DSS',
    text: 'Track skill trends, hard-to-fill roles, and strategic hiring recommendations in one decision dashboard.',
    tone: 'peach',
  },
]

const processSteps = [
  'Create JD with AI',
  'Candidate submits CV',
  'AI scoring & chatbot',
  'Interview & feedback',
  'Report & decision',
]

const roleCards = [
  {
    title: 'Tenant Admin / HR',
    items: ['Manage hiring campaigns', 'Track Kanban pipeline', 'View AI reports'],
  },
  {
    title: 'Interviewer',
    items: ['Read detailed AI briefs', 'Manage interview schedules', 'Add feedback quickly'],
  },
  {
    title: 'Candidate',
    items: ['Submit CVs easily', 'Receive scores and suggestions', 'Practice interviews with AI'],
  },
]

function DashboardPreview() {
  return (
    <div className="landing-preview" aria-hidden="true">
      <div className="preview-browser">
        <div className="preview-topbar">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-shell">
          <aside className="preview-sidebar">
            <span />
            <span />
            <span />
            <span />
          </aside>
          <div className="preview-main">
            <div className="preview-brand">
              <span className="preview-logo">J</span>
              <strong>JobFusion</strong>
              <small>Data Engine</small>
            </div>
            <div className="preview-tabs">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-table">
              <div className="preview-row preview-row-head">
                <span>Candidate</span>
                <span>Role match</span>
                <span>Score</span>
              </div>
              <div className="preview-row active">
                <span>Minh Nguyen</span>
                <span>Senior UI Designer</span>
                <span>92%</span>
              </div>
              <div className="preview-row">
                <span>Lan Pham</span>
                <span>Frontend Engineer</span>
                <span>86%</span>
              </div>
              <div className="preview-row">
                <span>Hoang Tran</span>
                <span>Product Analyst</span>
                <span>79%</span>
              </div>
            </div>
            <div className="preview-panels">
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
      <div className="preview-metric">
        <strong>98% accuracy</strong>
        <span>Resumes analyzed</span>
        <small>Thousands of profiles processed every month</small>
      </div>
    </div>
  )
}

export function LandingPage({ onGoToLogin, onGoToSignup }: LandingPageProps) {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="landing-brand" href="/landingpage" aria-label="JobFusion landing page">
          <span>J</span>
          <strong>JobFusion</strong>
        </a>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#process">How It Works</a>
          <a href="#benefits">Benefits</a>
          <a href="#roles">Roles</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="landing-nav-actions">
          <button type="button" className="landing-login" onClick={onGoToLogin}>
            Log in
          </button>
          <button type="button" className="landing-primary" onClick={onGoToSignup}>
            Start Free Trial
          </button>
        </div>
      </nav>

      <section className="landing-hero" style={{ backgroundImage: `url(${heroBackground})` }}>
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="landing-pill">Next-generation AI recruitment</span>
            <h1>Recruit smarter with Artificial Intelligence</h1>
            <p>
              Automate your entire hiring funnel: create job descriptions, analyze resumes, score candidates
              with AI, run chatbot pre-screening, and generate strategic reports.
            </p>
            <div className="landing-hero-actions">
              <button type="button" className="landing-cta" onClick={onGoToSignup}>
                Get Started Free <span aria-hidden="true">-&gt;</span>
              </button>
              <button type="button" className="landing-demo">
                <span aria-hidden="true">▶</span> Watch Demo
              </button>
            </div>
            <div className="landing-trust">
              <span>No credit card required</span>
              <span>14-day trial</span>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="landing-logos" aria-label="Trusted companies">
        <span>Google</span>
        <span>Microsoft</span>
        <span>Viettel</span>
        <span>FPT</span>
        <span>Techcombank</span>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section-heading">
          <span>Key Features</span>
          <h2>A complete AI-powered recruitment solution</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article className="landing-feature-card" key={feature.title}>
              <span className={`feature-icon ${feature.tone}`}>{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-process" id="process">
        <h2>A closed-loop hiring process in minutes</h2>
        <div className="process-list">
          {processSteps.map((step, index) => (
            <div className="process-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-benefits" id="benefits">
        <div className="benefit-copy">
          <h2>Save up to 70% of hiring time</h2>
          <div className="benefit-list">
            <article>
              <span>-&gt;</span>
              <div>
                <h3>HR focuses on people</h3>
                <p>AI handles repetitive work so your team can make the final decisions that matter.</p>
              </div>
            </article>
            <article>
              <span>-&gt;</span>
              <div>
                <h3>Higher-quality candidates</h3>
                <p>Screen resumes accurately and run deeper pre-screening before interviews.</p>
              </div>
            </article>
            <article>
              <span>-&gt;</span>
              <div>
                <h3>Multi-tenant SaaS</h3>
                <p>Manage multiple companies easily with detailed role-based permissions.</p>
              </div>
            </article>
          </div>
        </div>
        <div className="benefit-stats">
          <div>
            <strong>85%</strong>
            <span>Less screening time</span>
          </div>
          <div>
            <strong>4.8x</strong>
            <span>Faster hiring speed</span>
          </div>
        </div>
      </section>

      <section className="landing-roles" id="roles">
        <h2>Built for every role in recruitment</h2>
        <div className="role-grid">
          {roleCards.map((role) => (
            <article className="role-card" key={role.title}>
              <h3>{role.title}</h3>
              {role.items.map((item) => (
                <p key={item}>
                  <span>✓</span>
                  {item}
                </p>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final" id="pricing">
        <h2>Ready to upgrade your hiring process?</h2>
        <p>Hundreds of companies use JobFusion to find talent faster and make smarter hiring decisions.</p>
        <button type="button" onClick={onGoToSignup}>
          Book a Demo Today
        </button>
      </section>

      <footer className="landing-footer">
        <div>
          <a className="footer-brand" href="/landingpage" aria-label="JobFusion landing page">
            <span>J</span>
            <strong>JobFusion</strong>
          </a>
          <p>A complete AI-powered recruitment SaaS platform for businesses in Vietnam and across the region.</p>
        </div>
        <div>
          <h3>Product</h3>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#process">Documentation</a>
        </div>
        <div>
          <h3>Company</h3>
          <a href="#roles">About Us</a>
          <a href="#benefits">Blog</a>
          <a href="#pricing">Contact</a>
        </div>
        <div>
          <h3>Contact</h3>
          <p>Email: contact@jobfusion.vn</p>
          <p>Hotline: 1900 1234 1111</p>
        </div>
      </footer>
    </main>
  )
}
