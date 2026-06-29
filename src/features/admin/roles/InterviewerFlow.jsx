import React from 'react';

export default function InterviewerFlow({ activeSidebarMenu, renderCandidatesView }) {
  const renderInterviewerDashboard = () => (
    <div className="dashboard-view-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">INTERVIEWS TODAY</span>
            <div className="stat-trend-icon blue-bg"><i className="fa-solid fa-calendar-days"></i></div>
          </div>
          <div className="stat-value">3 Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">EVALUATIONS PENDING</span>
            <div className="stat-trend-icon green-bg"><i className="fa-solid fa-pen-clip"></i></div>
          </div>
          <div className="stat-value">1 Evaluation</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">COMPLETED OVERALL</span>
            <div className="stat-trend-icon orange-bg"><i className="fa-solid fa-circle-check"></i></div>
          </div>
          <div className="stat-value">42 Evaluations</div>
        </div>
      </div>
    </div>
  );

  const renderMyInterviewsView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">My Scheduled Interviews</h3></div>
      <div className="table-responsive">
        <table className="dashboard-table large">
          <thead>
            <tr><th>Candidate</th><th>Position</th><th>Date / Time</th><th>Link</th></tr>
          </thead>
          <tbody>
            <tr><td className="font-semibold">John Doe</td><td>React Tech Lead</td><td>Today, 2:00 PM</td><td><a href="#zoom" onClick={e => e.preventDefault()}>Join Zoom Room</a></td></tr>
            <tr><td className="font-semibold">Alice Vance</td><td>UI/UX Designer</td><td>Tomorrow, 10:00 AM</td><td><a href="#zoom" onClick={e => e.preventDefault()}>Join Zoom Room</a></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInterviewDetailView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">Interviewer Scorecard</h3></div>
      <div style={{ padding: '20px' }}>
        <p className="font-semibold">Rate Technical Skills</p>
        <div style={{ display: 'flex', gap: '8px', margin: '8px 0 20px' }}>
          <button type="button" className="btn-plan-action" style={{ padding: '6px 12px' }}>1 - Poor</button>
          <button type="button" className="btn-plan-action" style={{ padding: '6px 12px' }}>2 - Fair</button>
          <button type="button" className="btn-plan-action" style={{ padding: '6px 12px' }}>3 - Good</button>
          <button type="button" className="btn-plan-action active" style={{ padding: '6px 12px', backgroundColor: '#9a3412', color: 'white' }}>4 - Great</button>
          <button type="button" className="btn-plan-action" style={{ padding: '6px 12px' }}>5 - Perfect</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {activeSidebarMenu === 'dashboard' && renderInterviewerDashboard()}
      {activeSidebarMenu === 'my_interviews' && renderMyInterviewsView()}
      {activeSidebarMenu === 'candidates' && renderCandidatesView()}
      {activeSidebarMenu === 'interview_detail' && renderInterviewDetailView()}
    </>
  );
}
