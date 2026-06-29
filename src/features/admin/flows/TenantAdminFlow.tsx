import React from 'react';

export default function TenantAdminFlow({ activeSidebarMenu, setActiveSidebarMenu }) {
  const [staffData, setStaffData] = React.useState([
    { id: '1', name: 'Sarah Jenkins', email: 'sarah.jenkins@jobfusion.io', roles: ['HR', 'INTERVIEWER'], status: 'Active', created: 'Oct 12, 2023', initials: 'JS', bgClass: 'orange-avatar-bg' },
    { id: '2', name: 'Billie Chambers', email: 'b.chambers@jobfusion.io', roles: ['INTERVIEWER'], status: 'Active', created: 'Nov 04, 2023', initials: 'BC', bgClass: 'blue-avatar-bg' },
    { id: '3', name: 'Dianne Knight', email: 'dianne.k@jobfusion.io', roles: ['INTERVIEWER'], status: 'Inactive', created: 'Dec 20, 2023', initials: 'DK', bgClass: 'indigo-avatar-bg' },
    { id: '4', name: 'Arthur Morgan', email: 'a.morgan@jobfusion.io', roles: ['INTERVIEWER'], status: 'Pending', created: 'Jan 15, 2024', initials: 'AM', bgClass: 'orange-avatar-bg' },
    { id: '5', name: 'Sarah Parker', email: 'sarah.p@jobfusion.io', roles: ['HR'], status: 'Active', created: 'Feb 02, 2024', initials: 'SP', bgClass: 'blue-avatar-bg' },
    { id: '6', name: 'David Ross', email: 'd.ross@ttbmedia.com', roles: ['HR'], status: 'Active', created: 'Feb 10, 2024', initials: 'DR', bgClass: 'indigo-avatar-bg' },
    { id: '7', name: 'Emma Stone', email: 'emma@ttbmedia.com', roles: ['INTERVIEWER'], status: 'Inactive', created: 'Mar 01, 2024', initials: 'ES', bgClass: 'light-blue-avatar-bg' },
    { id: '8', name: 'John Doe', email: 'john.d@company.com', roles: ['INTERVIEWER'], status: 'Pending', created: 'Mar 15, 2024', initials: 'JD', bgClass: 'orange-avatar-bg' },
  ]);

  const [searchStaff, setSearchStaff] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [staffPage, setStaffPage] = React.useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newRoles, setNewRoles] = React.useState(['INTERVIEWER']);
  const [newStatus, setNewStatus] = React.useState('Active');

  const [editingStaff, setEditingStaff] = React.useState(null);
  const [editName, setEditName] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editRoles, setEditRoles] = React.useState([]);
  const [editStatus, setEditStatus] = React.useState('');

  const renderTenantAdminDashboard = () => (
    <div className="dashboard-view-content">
      {/* 4 Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {/* Active Job Postings */}
        <div className="stat-card" style={{ padding: '20px', position: 'relative' }}>
          <div className="stat-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title" style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px' }}>ACTIVE JOB POSTINGS</span>
            <div className="stat-icon-wrapper" style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#fff5f5', color: '#ea4335', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-briefcase" style={{ fontSize: '14px' }}></i>
            </div>
          </div>
          <div className="stat-value-group" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>24</span>
            <span className="stat-trend positive" style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>+12%</span>
          </div>
        </div>

        {/* Total Applicants */}
        <div className="stat-card" style={{ padding: '20px', position: 'relative' }}>
          <div className="stat-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title" style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px' }}>TOTAL APPLICANTS</span>
            <div className="stat-icon-wrapper" style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-user-group" style={{ fontSize: '14px' }}></i>
            </div>
          </div>
          <div className="stat-value-group" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>842</span>
            <span className="stat-trend positive" style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>+240</span>
          </div>
        </div>

        {/* Time-To-Hire */}
        <div className="stat-card" style={{ padding: '20px', position: 'relative' }}>
          <div className="stat-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title" style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px' }}>TIME-TO-HIRE</span>
            <div className="stat-icon-wrapper" style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-clock" style={{ fontSize: '14px' }}></i>
            </div>
          </div>
          <div className="stat-value-group" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>18 Days</span>
            <span className="stat-trend negative" style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>-2d</span>
          </div>
        </div>

        {/* Interviews Today */}
        <div className="stat-card" style={{ padding: '20px', position: 'relative' }}>
          <div className="stat-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title" style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px' }}>INTERVIEWS TODAY</span>
            <div className="stat-icon-wrapper" style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#faf5ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-calendar-days" style={{ fontSize: '14px' }}></i>
            </div>
          </div>
          <div className="stat-value-group" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>5</span>
            <span className="stat-trend neutral" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Today</span>
          </div>
        </div>
      </div>

      {/* Row 2: Funnel and Quota */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        {/* Left Column: Recruitment Funnel */}
        <div className="dashboard-card recruitment-funnel-card" style={{ padding: '24px 32px' }}>
          <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: 'none', padding: 0 }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Recruitment Funnel</h3>
              <p className="card-subtitle" style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Applicant conversion through hiring stages</p>
            </div>
            <a href="#" className="detail-report-link" style={{ fontSize: '13.5px', fontWeight: 700, color: '#ea4335', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
              View Detailed Report <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>

          {/* Funnel list */}
          <div className="funnel-progress-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Applied */}
            <div className="funnel-item-row">
              <div className="funnel-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="funnel-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>APPLIED</span>
                <span className="funnel-val" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>143</span>
              </div>
              <div className="funnel-bar-bg" style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="funnel-bar-fill" style={{ width: '95%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Screening */}
            <div className="funnel-item-row">
              <div className="funnel-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="funnel-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>SCREENING</span>
                <span className="funnel-val" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>89</span>
              </div>
              <div className="funnel-bar-bg" style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="funnel-bar-fill" style={{ width: '62%', height: '100%', backgroundColor: '#a855f7', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Shortlisted */}
            <div className="funnel-item-row">
              <div className="funnel-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="funnel-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>SHORTLISTED</span>
                <span className="funnel-val" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>42</span>
              </div>
              <div className="funnel-bar-bg" style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="funnel-bar-fill" style={{ width: '29%', height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Interviewing */}
            <div className="funnel-item-row">
              <div className="funnel-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="funnel-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>INTERVIEWING</span>
                <span className="funnel-val" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>21</span>
              </div>
              <div className="funnel-bar-bg" style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="funnel-bar-fill" style={{ width: '15%', height: '100%', backgroundColor: '#f97316', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Offered */}
            <div className="funnel-item-row">
              <div className="funnel-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="funnel-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>OFFERED</span>
                <span className="funnel-val" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>6</span>
              </div>
              <div className="funnel-bar-bg" style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="funnel-bar-fill" style={{ width: '4%', height: '100%', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Staff Quota & Active Plan */}
        <div className="funnel-sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Staff Quota Card */}
          <div className="dashboard-card quota-card" style={{ padding: '24px' }}>
            <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: 'none', padding: 0 }}>
              <h3 className="card-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Staff Quota</h3>
              <span className="quota-badge" style={{ fontSize: '11px', fontWeight: 700, color: '#ea4335', backgroundColor: '#fff5f5', padding: '2px 8px', borderRadius: '4px' }}>8 / 10 Seats</span>
            </div>

            {/* Radial progress ring */}
            <div className="radial-progress-wrapper" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <div className="circular-progress-container" style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ea4335" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="50.24" strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div className="progress-center-text" style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="progress-num" style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>8/10</span>
                  <span className="progress-lbl" style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', marginTop: '2px', textTransform: 'uppercase' }}>Used</span>
                </div>
              </div>
            </div>

            <p className="quota-hint-text" style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
              You have <strong style={{ color: '#0f172a' }}>2 seats available</strong> in your current professional plan. Optimize your team allocation now.
            </p>
          </div>

          {/* Active Plan Card */}
          <div className="dashboard-card active-plan-card" style={{ padding: '24px', backgroundColor: '#1e293b', border: 'none', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
            <div>
              <span className="plan-tag-caps" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#cbd5e1', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#38bdf8' }}></i> ACTIVE PLAN
              </span>
              <h3 className="plan-title-bold" style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '8px', marginBottom: '2px' }}>Professional</h3>
              <p className="plan-subtitle-grey" style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Full AI-Assisted Recruitment Suite</p>
            </div>
            
            <div className="plan-renewal-footer flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px' }}>
              <div>
                <span className="renewal-label-caps" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', display: 'block' }}>RENEWAL DATE</span>
                <span className="renewal-date-val" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px', display: 'block' }}>Oct 24, 2024</span>
              </div>
              <button type="button" className="btn-manage-plan-custom" style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, color: '#ffffff', backgroundColor: '#ea4335', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Interviews and AI Insights */}
      <div className="dashboard-grid">
        {/* Left Column: Upcoming Interviews */}
        <div className="dashboard-card upcoming-interviews-card" style={{ padding: '24px' }}>
          <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: 'none', padding: 0 }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Upcoming Interviews</h3>
              <p className="card-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Scheduled for today & tomorrow</p>
            </div>
            <button type="button" className="action-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}><i className="fa-solid fa-ellipsis-vertical"></i></button>
          </div>

          <div className="interviews-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Interview Item 1 */}
            <div className="interview-list-item-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div className="candidate-info-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar-headshot-box" style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="Sarah" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Sarah Jenkins</h4>
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>Senior DevOps Engineer</span>
                </div>
              </div>
              
              <div className="interviewer-info-group" style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', display: 'block' }}>INTERVIEWER</span>
                <h5 style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', margin: '2px 0 0' }}>David Chen</h5>
              </div>

              <div className="time-info-group" style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ea4335', display: 'block' }}>10:00 AM</span>
                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px', display: 'block' }}>In 45 Mins</span>
              </div>
            </div>

            {/* Interview Item 2 */}
            <div className="interview-list-item-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div className="candidate-info-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar-headshot-box" style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="Marcus" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Marcus Thorne</h4>
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>Product Manager</span>
                </div>
              </div>
              
              <div className="interviewer-info-group" style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', display: 'block' }}>INTERVIEWER</span>
                <h5 style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', margin: '2px 0 0' }}>Elena Rodriguez</h5>
              </div>

              <div className="time-info-group" style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ea4335', display: 'block' }}>02:30 PM</span>
                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px', display: 'block' }}>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="dashboard-card ai-insights-dss-card" style={{ padding: '24px' }}>
          <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: 'none', padding: 0 }}>
            <h3 className="card-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#ea4335' }}></i> AI Insights (DSS)
            </h3>
          </div>

          {/* Badges */}
          <div className="insights-badges-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            <span className="insight-badge-pill error" style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Cloud Architecture <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '10px' }}></i>
            </span>
            <span className="insight-badge-pill error" style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Go Lang <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '10px' }}></i>
            </span>
            <span className="insight-badge-pill warning" style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', padding: '4px 10px', borderRadius: '20px' }}>
              Data Security
            </span>
          </div>

          <span className="section-label-caps" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', color: '#94a3b8', display: 'block', marginBottom: '12px' }}>
            DIFFICULT TO FILL POSITIONS
          </span>

          {/* Difficult positions list */}
          <div className="difficult-positions-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div className="difficult-position-item flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="position-title" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Senior DevOps Engineer</span>
              <span className="position-days" style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>42 Days Open</span>
            </div>
            <div className="difficult-position-item flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="position-title" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>ML Ops Specialist</span>
              <span className="position-days" style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>31 Days Open</span>
            </div>
          </div>

          {/* View Full AI Report Link button */}
          <a href="#" className="btn-full-ai-report" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px 0', border: '1px solid #e2e8f0', borderRadius: '6px', textDecoration: 'none', color: '#475569', fontSize: '12.5px', fontWeight: 700, transition: 'background-color 0.15s' }}>
            <i className="fa-solid fa-chart-simple"></i> View full AI report <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }}></i>
          </a>
        </div>
      </div>
    </div>
  );

  const renderStaffManagementView = () => {
    // Filters logic
    const filteredStaff = staffData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchStaff.toLowerCase()) || 
                            item.email.toLowerCase().includes(searchStaff.toLowerCase());
      const matchesRole = filterRole === 'all' || item.roles.includes(filterRole);
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Pagination logic
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
    const currentPageIdx = Math.min(staffPage - 1, totalPages - 1);
    const paginatedStaff = filteredStaff.slice(currentPageIdx * itemsPerPage, (currentPageIdx + 1) * itemsPerPage);

    // Delete staff handler
    const handleDeleteStaff = (id) => {
      setStaffData(staffData.filter(item => item.id !== id));
    };

    // Add staff handler
    const handleAddStaffSubmit = (e) => {
      e.preventDefault();
      if (!newName || !newEmail) return;
      
      const newInitial = newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const randomBg = ['orange-avatar-bg', 'blue-avatar-bg', 'indigo-avatar-bg', 'light-blue-avatar-bg'][Math.floor(Math.random() * 4)];
      
      const newAccount = {
        id: Date.now().toString(),
        name: newName,
        email: newEmail,
        roles: newRoles,
        status: newStatus,
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        initials: newInitial,
        bgClass: randomBg
      };

      setStaffData([...staffData, newAccount]);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewRoles(['INTERVIEWER']);
    };

    // Edit staff handler
    const handleOpenEdit = (staff) => {
      setEditingStaff(staff);
      setEditName(staff.name);
      setEditEmail(staff.email);
      setEditRoles(staff.roles);
      setEditStatus(staff.status);
    };

    const handleEditStaffSubmit = (e) => {
      e.preventDefault();
      if (!editName || !editEmail) return;

      setStaffData(staffData.map(item => {
        if (item.id === editingStaff.id) {
          const newInitial = editName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          return {
            ...item,
            name: editName,
            email: editEmail,
            roles: editRoles,
            status: editStatus,
            initials: newInitial
          };
        }
        return item;
      }));

      setEditingStaff(null);
    };

    return (
      <div className="staff-management-view-content" style={{ position: 'relative' }}>
        {/* Breadcrumbs */}
        <div className="admin-breadcrumb" style={{ marginBottom: '12px' }}>
          <i className="fa-solid fa-house breadcrumb-icon clickable" onClick={() => setActiveSidebarMenu('dashboard')}></i>
          <span className="breadcrumb-item clickable" onClick={() => setActiveSidebarMenu('dashboard')}>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active-breadcrumb" style={{ color: '#ea4335' }}>Staff Management</span>
        </div>

        {/* Title Block & Progress */}
        <div className="staff-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Staff Management</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px' }}>Manage your team members and recruitment permissions.</p>
          </div>
          
          {/* Staff Accounts Progress Box */}
          <div className="dashboard-card staff-quota-box" style={{ width: '320px', padding: '10px 16px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Staff Accounts</span>
              <span style={{ color: '#ea4335' }}>{staffData.length} / 10</span>
            </div>
            <div className="quota-bar-bg" style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div className="quota-bar-fill" style={{ width: `${(staffData.length / 10) * 100}%`, height: '100%', backgroundColor: '#ea4335', borderRadius: '3px' }}></div>
            </div>
            <span style={{ display: 'block', textAlign: 'right', fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '6px' }}>{Math.max(0, 10 - staffData.length)} seats remaining</span>
          </div>
        </div>

        {/* Filter & Search Row */}
        <div className="staff-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="actions-left-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Role Filter */}
            <div className="select-filter-group" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 12px', height: '40px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', marginRight: '6px' }}>Role:</span>
              <select 
                value={filterRole} 
                onChange={(e) => { setFilterRole(e.target.value); setStaffPage(1); }}
                style={{ border: 'none', background: 'transparent', fontSize: '13.5px', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">All Roles</option>
                <option value="HR">HR</option>
                <option value="INTERVIEWER">Interviewer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="select-filter-group" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 12px', height: '40px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', marginRight: '6px' }}>Status:</span>
              <select 
                value={filterStatus} 
                onChange={(e) => { setFilterStatus(e.target.value); setStaffPage(1); }}
                style={{ border: 'none', background: 'transparent', fontSize: '13.5px', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* More Filters */}
            <button type="button" className="btn-more-filters" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 16px', fontSize: '13.5px', fontWeight: 600, color: '#334155', height: '40px', cursor: 'pointer' }}>
              <i className="fa-solid fa-sliders"></i> More Filters
            </button>
          </div>

          <div className="actions-right-search" style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', maxWidth: '540px' }}>
            {/* Search Input */}
            <div className="header-search-wrapper" style={{ margin: 0, width: '100%', border: '1px solid #cbd5e1', borderRadius: '24px', height: '40px' }}>
              <i className="fa-solid fa-magnifying-glass header-search-icon"></i>
              <input 
                type="text" 
                className="header-search-input" 
                placeholder="Search candidates, skills, or locations..." 
                value={searchStaff}
                onChange={(e) => { setSearchStaff(e.target.value); setStaffPage(1); }}
              />
            </div>

            {/* Create Button */}
            <button 
              type="button" 
              className="btn-create-staff" 
              onClick={() => setShowAddModal(true)}
              style={{ padding: '0 24px', height: '40px', backgroundColor: '#ea4335', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Create Staff Account
            </button>
          </div>
        </div>

        {/* Staff Table Card */}
        <div className="dashboard-card full-width" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="dashboard-table large" style={{ margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textAlign: 'center', width: '28%' }}>FULL NAME</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textAlign: 'left', width: '28%' }}>EMAIL</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textAlign: 'left', width: '15%' }}>ROLE</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textAlign: 'left', width: '12%' }}>STATUS</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textAlign: 'left', width: '12%' }}>DATE CREATED</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textAlign: 'center', width: '15%' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStaff.length > 0 ? (
                  paginatedStaff.map((staff) => (
                    <tr key={staff.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Name with initials avatar */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
                          <div className={`avatar-placeholder ${staff.bgClass}`} style={{ width: '38px', height: '38px', borderRadius: '50%', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {staff.initials}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{staff.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#64748b', textAlign: 'left' }}>
                        {staff.email}
                      </td>

                      {/* Role Badges */}
                      <td style={{ padding: '10px 16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {staff.roles.map((r) => (
                            <span 
                              key={r} 
                              style={{ 
                                fontSize: '10.5px', 
                                fontWeight: 700, 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                backgroundColor: r === 'HR' ? '#eff6ff' : '#faf5ff',
                                color: r === 'HR' ? '#1e40af' : '#6b21a8'
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span 
                            style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: staff.status === 'Active' ? '#22c55e' : staff.status === 'Inactive' ? '#64748b' : '#f97316' 
                            }}
                          ></span>
                          <span 
                            style={{ 
                              fontSize: '13px', 
                              fontWeight: 700,
                              color: staff.status === 'Active' ? '#22c55e' : staff.status === 'Inactive' ? '#64748b' : '#f97316' 
                            }}
                          >
                            {staff.status}
                          </span>
                        </div>
                      </td>

                      {/* Date Created */}
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#64748b', textAlign: 'left' }}>
                        {staff.created}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                          <button 
                            type="button" 
                            className="action-icon-btn" 
                            title="Edit Account"
                            onClick={() => handleOpenEdit(staff)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '16px' }}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button 
                            type="button" 
                            className="action-icon-btn" 
                            title="Delete Account"
                            onClick={() => handleDeleteStaff(staff.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '16px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      No staff accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="tenants-pagination-bar" style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="pagination-info" style={{ fontSize: '12.5px', color: '#64748b' }}>
              Showing {paginatedStaff.length} of {filteredStaff.length} staff accounts
            </span>
            <div className="pagination-buttons" style={{ display: 'flex', gap: '6px' }}>
              <button 
                type="button" 
                className="pagination-btn-nav" 
                disabled={staffPage === 1}
                onClick={() => setStaffPage(prev => Math.max(1, prev - 1))}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button 
                  key={idx + 1} 
                  type="button" 
                  className={`pagination-btn-num ${staffPage === idx + 1 ? 'active' : ''}`}
                  onClick={() => setStaffPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}

              <button 
                type="button" 
                className="pagination-btn-nav" 
                disabled={staffPage === totalPages}
                onClick={() => setStaffPage(prev => Math.min(totalPages, prev + 1))}
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Create Staff Account */}
        {showAddModal && (
          <div className="modal-backdrop-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <form onSubmit={handleAddStaffSubmit} className="confirm-popup-card" style={{ width: '420px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', padding: 0 }}>
              <div className="modal-header flex-between" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Create Staff Account</span>
                <button type="button" className="close-modal-btn" onClick={() => setShowAddModal(false)} style={{ fontSize: '16px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label-caps">FULL NAME</label>
                  <input type="text" className="form-input-custom" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Sarah Jenkins" required />
                </div>
                <div>
                  <label className="form-label-caps">EMAIL ADDRESS</label>
                  <input type="email" className="form-input-custom" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="e.g. sarah@company.com" required />
                </div>
                <div>
                  <label className="form-label-caps">ROLES</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newRoles.includes('HR')}
                        onChange={(e) => {
                          if (e.target.checked) setNewRoles([...newRoles, 'HR']);
                          else setNewRoles(newRoles.filter(r => r !== 'HR'));
                        }}
                      />
                      HR
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newRoles.includes('INTERVIEWER')}
                        onChange={(e) => {
                          if (e.target.checked) setNewRoles([...newRoles, 'INTERVIEWER']);
                          else setNewRoles(newRoles.filter(r => r !== 'INTERVIEWER'));
                        }}
                      />
                      Interviewer
                    </label>
                  </div>
                </div>
                <div>
                  <label className="form-label-caps">STATUS</label>
                  <select className="form-input-custom" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-cancel-custom" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#ea4335', backgroundColor: '#ffffff', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-confirm-custom" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#ffffff', backgroundColor: '#ea4335', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Edit Staff Account */}
        {editingStaff && (
          <div className="modal-backdrop-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <form onSubmit={handleEditStaffSubmit} className="confirm-popup-card" style={{ width: '420px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', padding: 0 }}>
              <div className="modal-header flex-between" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Edit Staff Account</span>
                <button type="button" className="close-modal-btn" onClick={() => setEditingStaff(null)} style={{ fontSize: '16px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label-caps">FULL NAME</label>
                  <input type="text" className="form-input-custom" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label-caps">EMAIL ADDRESS</label>
                  <input type="email" className="form-input-custom" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label-caps">ROLES</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editRoles.includes('HR')}
                        onChange={(e) => {
                          if (e.target.checked) setEditRoles([...editRoles, 'HR']);
                          else setEditRoles(editRoles.filter(r => r !== 'HR'));
                        }}
                      />
                      HR
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editRoles.includes('INTERVIEWER')}
                        onChange={(e) => {
                          if (e.target.checked) setEditRoles([...editRoles, 'INTERVIEWER']);
                          else setEditRoles(editRoles.filter(r => r !== 'INTERVIEWER'));
                        }}
                      />
                      Interviewer
                    </label>
                  </div>
                </div>
                <div>
                  <label className="form-label-caps">STATUS</label>
                  <select className="form-input-custom" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-cancel-custom" onClick={() => setEditingStaff(null)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#ea4335', backgroundColor: '#ffffff', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-confirm-custom" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#ffffff', backgroundColor: '#ea4335', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header"><h3 className="card-title">Analytics & Token Usage</h3></div>
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
        <i className="fa-solid fa-chart-line" style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }}></i>
        <h4>Usage over time</h4>
        <p>Token usage has increased by 14% this month. Total calls: 124.5k.</p>
      </div>
    </div>
  );

  return (
    <>
      {activeSidebarMenu === 'dashboard' && renderTenantAdminDashboard()}
      {activeSidebarMenu === 'staff' && renderStaffManagementView()}
      {activeSidebarMenu === 'analytics' && renderAnalyticsView()}
    </>
  );
}
