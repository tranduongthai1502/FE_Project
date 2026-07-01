import type { ReactNode } from 'react';

type CandidateFlowProps = {
  activeSidebarMenu: string
  renderInterviewsView: () => ReactNode
}

export default function CandidateFlow({ activeSidebarMenu, renderInterviewsView }: CandidateFlowProps) {
  const renderCandidateDashboard = () => (
    <div className="dashboard-view-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">SUBMITTED JOBS</span>
            <div className="stat-trend-icon green-bg"><i className="fa-solid fa-briefcase"></i></div>
          </div>
          <div className="stat-value">3 Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">INTERVIEWS SCHEDULED</span>
            <div className="stat-trend-icon blue-bg"><i className="fa-solid fa-calendar-days"></i></div>
          </div>
          <div className="stat-value">1 Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">AI MATCH INDEX</span>
            <div className="stat-trend-icon orange-bg"><i className="fa-solid fa-brain"></i></div>
          </div>
          <div className="stat-value">94.2% Strength</div>
        </div>
      </div>
    </div>
  );

  const renderMyJobsView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">My Applications</h3></div>
      <div className="table-responsive">
        <table className="dashboard-table large">
          <thead>
            <tr><th>Company</th><th>Position</th><th>Date Applied</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td className="font-semibold">TTB Media</td><td>Senior React Engineer</td><td>Jun 28, 2026</td><td><span className="status-indicator status-active">Technical Test</span></td></tr>
            <tr><td className="font-semibold">Nexus Media Group</td><td>Front-end Architect</td><td>Jun 24, 2026</td><td><span className="status-indicator status-suspended">Reviewing</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAIInsightsView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">AI Resume Insights</h3></div>
      <div style={{ padding: '20px' }}>
        <p className="font-semibold" style={{ color: '#16a34a' }}><i className="fa-solid fa-circle-check"></i> Great keywords alignment for React & Redux!</p>
        <p className="font-semibold" style={{ color: '#ca8a04', marginTop: '10px' }}><i className="fa-solid fa-triangle-exclamation"></i> Consider adding cloud infrastructure experience (AWS/GCP).</p>
      </div>
    </div>
  );

  return (
    <>
      {activeSidebarMenu === 'dashboard' && renderCandidateDashboard()}
      {activeSidebarMenu === 'my_jobs' && renderMyJobsView()}
      {activeSidebarMenu === 'interviews' && renderInterviewsView()}
      {activeSidebarMenu === 'ai_insights' && renderAIInsightsView()}
    </>
  );
}
