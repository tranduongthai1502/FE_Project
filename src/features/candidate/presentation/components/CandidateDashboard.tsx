import { applications } from '../../domain/candidateData'

export function CandidateDashboard({ lastName }: { lastName: string }) {
  return (
    <>
      <section className="candidate-welcome">
        <div>
          <h1>Welcome back, {lastName}!</h1>
          <p>Here is your application progress and personalized AI recommendations.</p>
        </div>
        <span className="profile-views">
          <i className="fa-solid fa-eye"></i>
          12 Profile Views
        </span>
      </section>

      <section className="candidate-hero-grid">
        <article className="application-status-card">
          <div className="candidate-card-heading">
            <h2>Application Status: Senior UI Designer</h2>
            <span>VinGroup Corp</span>
          </div>
          <div className="status-timeline">
            <div className="status-line"></div>
            <div className="status-step done">
              <span><i className="fa-solid fa-check"></i></span>
              <strong>Applied</strong>
              <small>Oct 12, 2024</small>
            </div>
            <div className="status-step done">
              <span><i className="fa-solid fa-file-lines"></i></span>
              <strong>Screening</strong>
              <small>Oct 15, 2024</small>
            </div>
            <div className="status-step current">
              <span><i className="fa-solid fa-video"></i></span>
              <strong>Interviewing</strong>
              <small>In Progress</small>
            </div>
            <div className="status-step muted">
              <span><i className="fa-solid fa-desktop"></i></span>
              <strong>Offer</strong>
              <small>Pending</small>
            </div>
          </div>
        </article>

        <article className="interview-card">
          <h2><i className="fa-solid fa-chalkboard-user"></i> Upcoming Interview</h2>
          <div className="interview-panel">
            <span>Thursday, October 24</span>
            <strong>Technical & AI Coding Round</strong>
            <small>14:00 - 15:30 - Google Meet</small>
          </div>
          <button type="button">
            <i className="fa-solid fa-play"></i>
            Prepare with AI Coach
          </button>
        </article>
      </section>

      <section className="candidate-lower-grid">
        <article className="resume-insights-card">
          <div className="insight-title-row">
            <h2><i className="fa-solid fa-circle-info"></i> AI Resume Insights</h2>
            <span>85%</span>
          </div>
          <div className="insight-note">
            <strong><i className="fa-solid fa-lightbulb"></i> Improvement Tip:</strong>
            <p>"Your React experience is impressive, but consider adding Next.js projects to increase your match rate at VinGroup (Match +15%)."</p>
          </div>
          <div className="keyword-note">
            <strong><i className="fa-solid fa-key"></i> Missing Keywords:</strong>
            <div>
              <span>Unit Testing</span>
              <span>Micro-Frontends</span>
              <span>CI/CD</span>
            </div>
          </div>
          <button type="button" className="edit-resume-btn">Edit Resume Now <i className="fa-solid fa-arrow-right"></i></button>
        </article>

        <article className="active-applications-card">
          <div className="active-app-header">
            <h2>Active Applications</h2>
            <button type="button">View all (5)</button>
          </div>

          <div className="application-list">
            {applications.map((item) => (
              <div key={item.title} className="application-row">
                <div className="application-logo">{item.logo}</div>
                <div className="application-info">
                  <strong>{item.title}</strong>
                  <span>{item.company}</span>
                </div>
                <div className="application-status-text">
                  <strong>{item.status}</strong>
                  <span>{item.updated}</span>
                </div>
                <div className="application-progress">
                  <span style={{ width: `${item.progress}%` }}></span>
                </div>
                <button type="button" aria-label={`Open ${item.title} actions`}>
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}
