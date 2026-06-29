import React from 'react';

export default function HRFlow({ activeSidebarMenu, renderAnalyticsView }) {
  const renderHRDashboard = () => (
    <div className="dashboard-view-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">TOTAL CANDIDATES</span>
            <div className="stat-trend-icon blue-bg"><i className="fa-solid fa-user-group"></i></div>
          </div>
          <div className="stat-value">2,408 Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">ACTIVE JOBS</span>
            <div className="stat-trend-icon green-bg"><i className="fa-solid fa-briefcase"></i></div>
          </div>
          <div className="stat-value">15 Postings</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">SCREENINGS</span>
            <div className="stat-trend-icon orange-bg"><i className="fa-solid fa-bolt"></i></div>
          </div>
          <div className="stat-value">24 Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">SUCCESS RATE</span>
            <div className="stat-trend-icon red-bg"><i className="fa-solid fa-circle-check"></i></div>
          </div>
          <div className="stat-value">88.5%</div>
        </div>
      </div>
    </div>
  );

  const renderJobsView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header flex-between">
        <h3 className="card-title">Active Job Openings</h3>
        <button type="button" className="btn-save-changes" style={{ marginTop: 0, padding: '8px 16px' }}>+ Post Job</button>
      </div>
      <div className="table-responsive">
        <table className="dashboard-table large">
          <thead>
            <tr><th>Job Title</th><th>Department</th><th>Applicants</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td className="font-semibold">React Tech Lead</td><td>Engineering</td><td>45 Candidates</td><td><span className="status-indicator status-active">Open</span></td></tr>
            <tr><td className="font-semibold">UI/UX Designer</td><td>Design</td><td>22 Candidates</td><td><span className="status-indicator status-active">Open</span></td></tr>
            <tr><td className="font-semibold">HR Specialist</td><td>People</td><td>12 Candidates</td><td><span className="status-indicator status-suspended">Closed</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCandidatesView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">Candidates Pool</h3></div>
      <div className="table-responsive">
        <table className="dashboard-table large">
          <thead>
            <tr><th>Name</th><th>Role Applied</th><th>Match Score</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td className="font-semibold">John Doe</td><td>React Tech Lead</td><td><span className="badge badge-starter" style={{ color: '#166534', backgroundColor: '#dcfce7' }}>98% Match</span></td><td><span className="status-indicator status-active">Screened</span></td></tr>
            <tr><td className="font-semibold">Alice Vance</td><td>UI/UX Designer</td><td><span className="badge badge-starter" style={{ color: '#166534', backgroundColor: '#dcfce7' }}>91% Match</span></td><td><span className="status-indicator status-active">Interviewing</span></td></tr>
            <tr><td className="font-semibold">Bob Miller</td><td>QA Analyst</td><td><span className="badge badge-enterprise" style={{ color: '#991b1b', backgroundColor: '#fef2f2' }}>45% Match</span></td><td><span className="status-indicator status-suspended">Rejected</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmailManagementView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">Email Notification Triggers</h3></div>
      <div style={{ padding: '20px' }}>
        <ul className="plans-progress-list">
          <li className="plan-progress-item">
            <span className="font-semibold">Screening Success Template</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Triggers when candidate match score is &gt; 80%</span>
          </li>
          <li className="plan-progress-item">
            <span className="font-semibold">Interview Schedule Invitation</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Triggers when candidate moves to Interview phase</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderInterviewsView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">Interviews Calendar</h3></div>
      <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>
        <i className="fa-regular fa-calendar-days" style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }}></i>
        <p>No upcoming interviews scheduled for today.</p>
      </div>
    </div>
  );

  return (
    <>
      {activeSidebarMenu === 'dashboard' && renderHRDashboard()}
      {activeSidebarMenu === 'jobs' && renderJobsView()}
      {activeSidebarMenu === 'candidates' && renderCandidatesView()}
      {activeSidebarMenu === 'email' && renderEmailManagementView()}
      {activeSidebarMenu === 'interviews' && renderInterviewsView()}
      {activeSidebarMenu === 'analytics' && renderAnalyticsView()}
    </>
  );
}
