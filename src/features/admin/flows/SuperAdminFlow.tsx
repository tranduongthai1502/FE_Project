import React, { type Dispatch, type SetStateAction } from 'react';

export type TenantRecord = {
  id: string
  name: string
  domain: string
  initials: string
  plan: string
  expiration: string
  expirationSub: string
  expirationSubClass: string
  quotaUsed: number
  quotaMax: number
  status: string
  bgClass: string
}

type SuperAdminFlowProps = {
  activeSidebarMenu: string
  tenantSearch: string
  setTenantSearch: Dispatch<SetStateAction<string>>
  tenantFilterTab: string
  setTenantFilterTab: Dispatch<SetStateAction<string>>
  tenantFilterPlan: string
  setTenantFilterPlan: Dispatch<SetStateAction<string>>
  showPlanDropdown: boolean
  setShowPlanDropdown: Dispatch<SetStateAction<boolean>>
  selectedTenant: TenantRecord | null
  setSelectedTenant: Dispatch<SetStateAction<TenantRecord | null>>
  tenantsData: TenantRecord[]
  isCreatingTenant: boolean
  setIsCreatingTenant: Dispatch<SetStateAction<boolean>>
}

export default function SuperAdminFlow({
  activeSidebarMenu,
  tenantSearch,
  setTenantSearch,
  tenantFilterTab,
  setTenantFilterTab,
  tenantFilterPlan,
  setTenantFilterPlan,
  showPlanDropdown,
  setShowPlanDropdown,
  selectedTenant,
  setSelectedTenant,
  tenantsData,
  isCreatingTenant,
  setIsCreatingTenant
}: SuperAdminFlowProps) {
  const [formCompany, setFormCompany] = React.useState('TTB Media');
  const [formPlan, setFormPlan] = React.useState('Professional - $499/mo');
  const [formDomain, setFormDomain] = React.useState('acme');
  const [formAdminName, setFormAdminName] = React.useState('Jane Doe');
  const [formAdminEmail, setFormAdminEmail] = React.useState('jane@company.com');
  
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = React.useState(false);
  const [showErrorAlert, setShowErrorAlert] = React.useState(false);
  
  const renderDashboardView = () => (
    <div className="dashboard-view-content">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">TOTAL REVENUE</span>
            <div className="stat-change positive">
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>12.5%</span>
            </div>
          </div>
          <div className="stat-value">$124.5k</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">ACTIVE TENANTS</span>
            <div className="stat-change positive">
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>8.2%</span>
            </div>
          </div>
          <div className="stat-value">1,204</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">AVERAGE USAGE</span>
            <div className="stat-change positive">
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>5.4%</span>
            </div>
          </div>
          <div className="stat-value">68.2%</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">CHURN RATE</span>
            <div className="stat-change negative">
              <i className="fa-solid fa-arrow-trend-down"></i>
              <span>2.1%</span>
            </div>
          </div>
          <div className="stat-value">0.8%</div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Tenants */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Recent Tenants</h3>
            <button type="button" className="card-action-btn">View All</button>
          </div>
          
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="company-cell">
                      <div className="company-logo-avatar orange-bg">V</div>
                      <div className="company-text">
                        <span className="company-name font-semibold">Vanguard Corp</span>
                        <span className="company-domain">vanguard.io</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-outline badge-orange">ENTERPRISE</span></td>
                  <td><span className="status-dot-pulse active"></span><span className="status-label">Active</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="company-cell">
                      <div className="company-logo-avatar blue-bg">Q</div>
                      <div className="company-text">
                        <span className="company-name font-semibold">Quantum Inc</span>
                        <span className="company-domain">quantum.ai</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-outline badge-blue">PRO PLAN</span></td>
                  <td><span className="status-dot-pulse active"></span><span className="status-label">Active</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="company-cell">
                      <div className="company-logo-avatar green-bg">G</div>
                      <div className="company-text">
                        <span className="company-name font-semibold">Greenhouse Media</span>
                        <span className="company-domain">greenhouse.co</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-outline badge-slate">BASIC</span></td>
                  <td><span className="status-dot-pulse inactive"></span><span className="status-label">Inactive</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side: Tenants by Plan + Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Tenants by Plan</h3>
          </div>
          
          <div className="plans-progress-list">
            <div className="plan-progress-item">
              <div className="plan-progress-info">
                <span className="plan-progress-label">Enterprise</span>
                <span className="plan-progress-value">25% (301)</span>
              </div>
              <div className="plan-progress-bar-bg">
                <div className="plan-progress-bar-fill enterprise-fill" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div className="plan-progress-item">
              <div className="plan-progress-info">
                <span className="plan-progress-label">Pro Plan</span>
                <span className="plan-progress-value">45% (542)</span>
              </div>
              <div className="plan-progress-bar-bg">
                <div className="plan-progress-bar-fill pro-fill" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="plan-progress-item">
              <div className="plan-progress-info">
                <span className="plan-progress-label">Basic</span>
                <span className="plan-progress-value">20% (240)</span>
              </div>
              <div className="plan-progress-bar-bg">
                <div className="plan-progress-bar-fill basic-fill" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div className="plan-progress-item">
              <div className="plan-progress-info">
                <span className="plan-progress-label">Free Trial</span>
                <span className="plan-progress-value">10% (121)</span>
              </div>
              <div className="plan-progress-bar-bg">
                <div className="plan-progress-bar-fill free-fill" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="quick-actions-section">
            <h4 className="quick-actions-title">Quick Actions</h4>
            <div className="quick-actions-grid">
              <button type="button" className="quick-action-btn-item">
                <i className="fa-solid fa-user-plus"></i> Add Tenant
              </button>
              <button type="button" className="quick-action-btn-item">
                <i className="fa-solid fa-sliders"></i> Adjust Quota
              </button>
              <button type="button" className="quick-action-btn-item">
                <i className="fa-solid fa-file-invoice-dollar"></i> Billing
              </button>
              <button type="button" className="quick-action-btn-item">
                <i className="fa-solid fa-chart-pie"></i> System Report
              </button>
            </div>
          </div>
        </div>

        {/* System Prompts Status */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3 className="card-title">System Prompts Status</h3>
            <button type="button" className="card-action-btn">Manage Prompts</button>
          </div>
          
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Prompt Name</th>
                  <th>Version</th>
                  <th>Usage (24h)</th>
                  <th>Latency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">candidate_profile_parser</td>
                  <td>v2.4.1</td>
                  <td>12,402 calls</td>
                  <td>142ms</td>
                  <td><span className="status-indicator status-optimal">Optimal</span></td>
                </tr>
                <tr>
                  <td className="font-semibold">resume_screener_core</td>
                  <td>v4.1.0</td>
                  <td>45,924 calls</td>
                  <td>312ms</td>
                  <td><span className="status-indicator status-optimal">Optimal</span></td>
                </tr>
                <tr className="table-row-danger-bg">
                  <td className="font-semibold">interview_feedback_generator</td>
                  <td>v1.0.8</td>
                  <td>3,124 calls</td>
                  <td>1,824ms</td>
                  <td><span className="status-indicator status-review">Review Advised</span></td>
                </tr>
                <tr>
                  <td className="font-semibold">email_responder_template</td>
                  <td>v3.2.0</td>
                  <td>8,924 calls</td>
                  <td>98ms</td>
                  <td><span className="status-indicator status-stale">Stale Pipeline</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Activity */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3 className="card-title">Platform Activity (24h)</h3>
          </div>
          
          <div className="activity-stats-grid">
            <div className="activity-stat-item">
              <div className="activity-icon-wrapper blue-bg-icon">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div className="activity-text-wrapper">
                <span className="activity-label">New Registrations</span>
                <span className="activity-value">+420</span>
              </div>
            </div>
            <div className="activity-stat-item">
              <div className="activity-icon-wrapper orange-bg-icon">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div className="activity-text-wrapper">
                <span className="activity-label">Active Screenings</span>
                <span className="activity-value">1,402</span>
              </div>
            </div>
            <div className="activity-stat-item">
              <div className="activity-icon-wrapper red-bg-icon">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
              <div className="activity-text-wrapper">
                <span className="activity-label">Model Timeouts</span>
                <span className="activity-value">0</span>
              </div>
            </div>
            <div className="activity-stat-item">
              <div className="activity-icon-wrapper blue-bg-icon2">
                <i className="fa-solid fa-network-wired"></i>
              </div>
              <div className="activity-text-wrapper">
                <span className="activity-label">Total API Requests</span>
                <span className="activity-value">148.9k</span>
              </div>
            </div>
          </div>

          <div className="health-status-banner">
            <div className="health-status-left">
              <span className="pulsing-green-dot"></span>
              <span className="health-status-text">System Healthy: Global AWS Load 14%</span>
            </div>
            <i className="fa-solid fa-arrow-right health-arrow"></i>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTenantsView = () => {
    // Filter logic
    const filteredTenants = tenantsData.filter(t => {
      const searchMatch = t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || 
                          t.domain.toLowerCase().includes(tenantSearch.toLowerCase()) || 
                          t.plan.toLowerCase().includes(tenantSearch.toLowerCase());
      
      const tabMatch = tenantFilterTab === 'all' || 
                       (tenantFilterTab === 'active' && t.status === 'Active') || 
                       (tenantFilterTab === 'inactive' && t.status === 'Inactive');

      const planMatch = tenantFilterPlan === 'all' || 
                        (tenantFilterPlan === 'enterprise' && t.plan === 'ENTERPRISE') ||
                        (tenantFilterPlan === 'pro' && t.plan === 'PRO PLAN') ||
                        (tenantFilterPlan === 'growth' && t.plan === 'GROWTH');
                        
      return searchMatch && tabMatch && planMatch;
    });

    return (
      <div className="tenants-view-container">
        {/* Top Control Bar */}
        <div className="tenants-controls-bar">
          <div className="controls-left-group">
            {/* Filter Tabs */}
            <div className="filter-tabs-wrapper">
              <button 
                type="button" 
                className={`filter-tab-btn ${tenantFilterTab === 'all' ? 'active' : ''}`}
                onClick={() => setTenantFilterTab('all')}
              >
                All Tenants
              </button>
              <button 
                type="button" 
                className={`filter-tab-btn ${tenantFilterTab === 'active' ? 'active' : ''}`}
                onClick={() => setTenantFilterTab('active')}
              >
                Active
              </button>
              <button 
                type="button" 
                className={`filter-tab-btn ${tenantFilterTab === 'inactive' ? 'active' : ''}`}
                onClick={() => setTenantFilterTab('inactive')}
              >
                Inactive
              </button>
            </div>

            {/* Filter by Plan button with dropdown */}
            <div className="plan-filter-dropdown-wrapper" style={{ position: 'relative' }}>
              <button 
                type="button" 
                className={`filter-plan-btn ${tenantFilterPlan !== 'all' ? 'has-filter' : ''}`}
                onClick={() => setShowPlanDropdown(!showPlanDropdown)}
              >
                Filter by Plan <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px', marginLeft: '6px' }}></i>
              </button>
              
              {showPlanDropdown && (
                <div className="plan-dropdown-menu">
                  <button type="button" className={`dropdown-item ${tenantFilterPlan === 'all' ? 'active' : ''}`} onClick={() => { setTenantFilterPlan('all'); setShowPlanDropdown(false); }}>All Plans</button>
                  <button type="button" className={`dropdown-item ${tenantFilterPlan === 'enterprise' ? 'active' : ''}`} onClick={() => { setTenantFilterPlan('enterprise'); setShowPlanDropdown(false); }}>Enterprise</button>
                  <button type="button" className={`dropdown-item ${tenantFilterPlan === 'pro' ? 'active' : ''}`} onClick={() => { setTenantFilterPlan('pro'); setShowPlanDropdown(false); }}>Pro Plan</button>
                  <button type="button" className={`dropdown-item ${tenantFilterPlan === 'growth' ? 'active' : ''}`} onClick={() => { setTenantFilterPlan('growth'); setShowPlanDropdown(false); }}>Growth</button>
                </div>
              )}
            </div>
          </div>

          <div className="controls-right-group">
            {/* Search Input */}
            <div className="header-search-wrapper" style={{ margin: 0, width: '280px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <i className="fa-solid fa-magnifying-glass header-search-icon"></i>
              <input 
                type="text" 
                className="header-search-input" 
                placeholder="Search company, plan..." 
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
              />
            </div>
            
            {/* Create Button */}
            <button 
              type="button" 
              className="btn-save-changes create-tenant-btn" 
              onClick={() => setIsCreatingTenant(true)}
              style={{ marginTop: 0, padding: '10px 18px' }}
            >
              Create New Tenant
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>TOTAL REVENUE</span>
              <div className="stat-trend-icon green-bg">
                <i className="fa-solid fa-arrow-trend-up"></i>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '24px', marginTop: '4px' }}>$124.5k</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>ACTIVE TENANTS</span>
              <div className="stat-trend-icon blue-bg">
                <i className="fa-solid fa-building"></i>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '24px', marginTop: '4px' }}>1,204</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>AVERAGE USAGE</span>
              <div className="stat-trend-icon orange-bg">
                <i className="fa-solid fa-rotate"></i>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '24px', marginTop: '4px' }}>68.2%</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>CHURN RATE</span>
              <div className="stat-trend-icon red-bg">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '24px', marginTop: '4px' }}>0.8%</div>
          </div>
        </div>

        {/* List Card or Empty State */}
        {filteredTenants.length === 0 ? (
          <div className="dashboard-card full-width empty-state-card-container">
            <div className="empty-state-content">
              <div className="empty-state-icon-wrapper">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <span className="empty-state-title">No tenants found.</span>
            </div>
          </div>
        ) : (
          <div className="dashboard-card full-width" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="dashboard-table large tenants-manager-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px' }}>Company Name</th>
                    <th>Subscription Plan</th>
                    <th>Expiration Date</th>
                    <th>User Quota</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t) => (
                    <tr key={t.id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div className="company-info-cell clickable" onClick={() => setSelectedTenant(t)}>
                          <div className={`company-logo-square-avatar ${t.bgClass}`}>{t.initials}</div>
                          <div className="company-text-wrapper">
                            <span className="company-name hover-underline">{t.name}</span>
                            <span className="company-domain">{t.domain}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${t.plan === 'ENTERPRISE' ? 'badge-enterprise-outline' : t.plan === 'PRO PLAN' ? 'badge-pro-outline' : 'badge-basic-outline'}`}>
                          {t.plan}
                        </span>
                      </td>
                      <td>
                        <div className="expiration-cell-wrapper">
                          <span className="expiration-date-main">{t.expiration}</span>
                          {t.expirationSub && (
                            <span className={`expiration-date-sub ${t.expirationSubClass || ''}`}>
                              {t.expirationSub}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="quota-cell-wrapper">
                          <div className="quota-bar-bg">
                            <div className="quota-bar-fill" style={{ width: `${(t.quotaUsed / t.quotaMax) * 100}%` }}></div>
                          </div>
                          <span className="quota-text">{t.quotaUsed}/{t.quotaMax}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-indicator ${t.status === 'Active' ? 'status-active' : 'status-suspended'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <button type="button" className="action-icon-btn"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Banner */}
            <div className="tenants-pagination-bar">
              <span className="pagination-info">Showing 1-{filteredTenants.length} of 1,204 Tenants</span>
              <div className="pagination-buttons">
                <button type="button" className="pagination-btn-nav"><i className="fa-solid fa-chevron-left"></i></button>
                <button type="button" className="pagination-btn-num active">1</button>
                <button type="button" className="pagination-btn-num">2</button>
                <button type="button" className="pagination-btn-num">3</button>
                <span className="pagination-dots">...</span>
                <button type="button" className="pagination-btn-num">302</button>
                <button type="button" className="pagination-btn-nav"><i className="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTenantDetailView = (tenant) => {
    const getTenantDetailInfo = (name) => {
      if (name.includes('Nexus')) {
        return {
          industry: 'Media & Marketing',
          size: '100-250 Employees',
          created: 'Oct 24, 2023',
          region: 'United States',
          planName: 'Enterprise Fusion',
          billing: '$2,499.00',
          daysRemaining: '512 Days',
          daysPercent: '75%',
          adminName: 'Michael Vance',
          adminEmail: 'michael.v@nexusmedia.com',
          adminActivated: 'Oct 24, 2023'
        };
      } else if (name.includes('Vanguard')) {
        return {
          industry: 'Logistics & Transport',
          size: '50-100 Employees',
          created: 'Dec 15, 2021',
          region: 'Germany',
          planName: 'Pro Logistics',
          billing: '$599.00',
          daysRemaining: '0 Days',
          daysPercent: '0%',
          adminName: 'James Miller',
          adminEmail: 'j.miller@vanguard.io',
          adminActivated: 'Dec 15, 2021'
        };
      } else if (name.includes('TalentCloud')) {
        return {
          industry: 'Talent & HR Tech',
          size: '10-50 Employees',
          created: 'May 12, 2026',
          region: 'Canada',
          planName: 'Enterprise Fusion',
          billing: '$1,899.00',
          daysRemaining: '720 Days',
          daysPercent: '90%',
          adminName: 'Rebecca Hall',
          adminEmail: 'rebecca@talentcloud.ai',
          adminActivated: 'May 12, 2026'
        };
      } else if (name.includes('SkyBlue')) {
        return {
          industry: 'Venture Capital',
          size: '1-10 Employees',
          created: 'Jan 30, 2025',
          region: 'Singapore',
          planName: 'Growth Fusion',
          billing: '$899.00',
          daysRemaining: '120 Days',
          daysPercent: '30%',
          adminName: 'Alex Mercer',
          adminEmail: 'alex@skyblue.com',
          adminActivated: 'Jan 30, 2025'
        };
      } else {
        // TTB Media
        return {
          industry: 'Media & Advertising',
          size: '50-100 Employees',
          created: 'Oct 24, 2025',
          region: 'VietNam',
          planName: 'Growth Fusion',
          billing: '$899.00',
          daysRemaining: '365 Days',
          daysPercent: '100%',
          adminName: 'Sarah Jenkins',
          adminEmail: 'sarah.j@ttbmedia.com',
          adminActivated: 'Oct 24, 2025'
        };
      }
    };

    const info = getTenantDetailInfo(tenant.name);

    return (
      <div className="tenant-detail-view-container">
        {/* Header row */}
        <div className="tenant-detail-header-row flex-between">
          <div className="detail-header-left">
            <h2 className="detail-tenant-name">{tenant.name}</h2>
            <span className={`status-indicator-badge ${tenant.status === 'Active' ? 'active' : 'inactive'}`}>
              <span className="dot"></span>
              {tenant.status.toUpperCase()}
            </span>
          </div>
          <button type="button" className="btn-deactivate-tenant">
            {tenant.status === 'Active' ? 'Deactivate Tenant' : 'Activate Tenant'}
          </button>
        </div>

        {/* Row 1: Company Information */}
        <div className="dashboard-grid detail-row-1" style={{ gridTemplateColumns: '1fr' }}>
          {/* Company Information Card */}
          <div className="dashboard-card company-info-detail-card full-width">
            <div className="card-header">
              <div className="card-header-title-group">
                <div className="detail-card-icon-wrapper orange-bg">
                  <i className="fa-solid fa-address-card"></i>
                </div>
                <h3 className="card-title">Company Information</h3>
              </div>
              <button type="button" className="action-icon-btn"><i className="fa-solid fa-ellipsis-vertical"></i></button>
            </div>
            
            <div className="info-detail-grid">
              <div className="info-detail-item">
                <span className="info-detail-label">COMPANY NAME</span>
                <span className="info-detail-value">{tenant.name}</span>
              </div>
              <div className="info-detail-item">
                <span className="info-detail-label">DOMAIN</span>
                <span className="info-detail-value domain-link-value">
                  {tenant.domain} 
                  <i className="fa-solid fa-arrow-up-right-from-square domain-link-icon"></i>
                </span>
              </div>
              <div className="info-detail-item">
                <span className="info-detail-label">INDUSTRY</span>
                <span className="info-detail-value">{info.industry}</span>
              </div>
              <div className="info-detail-item">
                <span className="info-detail-label">COMPANY SIZE</span>
                <span className="info-detail-value font-medium-value">
                  <i className="fa-solid fa-user-group value-inline-icon"></i>
                  {info.size}
                </span>
              </div>
              <div className="info-detail-item">
                <span className="info-detail-label">CREATED DATE</span>
                <span className="info-detail-value">{info.created}</span>
              </div>
              <div className="info-detail-item">
                <span className="info-detail-label">REGION</span>
                <span className="info-detail-value">{info.region}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Subscription Plan and Tenant Admin */}
        <div className="dashboard-grid detail-row-2">
          {/* Subscription Plan Card */}
          <div className="dashboard-card sub-plan-detail-card">
            <div className="card-header flex-col-header">
              <div className="card-header-title-group">
                <div className="detail-card-icon-wrapper blue-bg">
                  <i className="fa-solid fa-award"></i>
                </div>
                <div className="sub-plan-title-wrapper">
                  <h3 className="card-title" style={{ marginBottom: '2px' }}>Subscription Plan</h3>
                  <span className="sub-plan-name-highlight">{info.planName}</span>
                </div>
              </div>
            </div>

            <div className="billing-summary-grid">
              <div className="billing-box">
                <span className="billing-box-label">Monthly Billing</span>
                <span className="billing-box-value">{info.billing}</span>
              </div>
              <div className="billing-box">
                <span className="billing-box-label">Days Remaining</span>
                <span className="billing-box-value font-green-value">
                  <i className="fa-solid fa-calendar-check calendar-check-icon"></i>
                  {info.daysRemaining}
                </span>
              </div>
            </div>

            <div className="sub-details-list">
              <div className="sub-detail-row">
                <div className="sub-detail-col">
                  <span className="sub-detail-label">Start Date</span>
                  <span className="sub-detail-value">{tenant.status === 'Active' ? 'Oct 24, 2023' : 'Dec 15, 2021'}</span>
                </div>
                <div className="sub-detail-col text-right-col">
                  <span className="sub-detail-label">Expiration Date</span>
                  <span className="sub-detail-value">{tenant.expiration}</span>
                </div>
              </div>
              <div className="sub-detail-row">
                <div className="sub-detail-col">
                  <span className="sub-detail-label">Renewal Cycle</span>
                  <span className="sub-detail-value">Annual</span>
                </div>
                <div className="sub-detail-col text-right-col">
                  <span className="sub-detail-label">Trialing</span>
                  <span className="sub-detail-value font-green-enabled">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Admin Card */}
          <div className="dashboard-card tenant-admin-detail-card">
            <div className="card-header">
              <div className="card-header-title-group">
                <div className="detail-card-icon-wrapper indigo-bg">
                  <i className="fa-solid fa-id-card"></i>
                </div>
                <h3 className="card-title">Tenant Admin</h3>
              </div>
            </div>

            <div className="admin-profile-section">
              <div className="admin-avatar-wrapper">
                <img src="/tenant_admin_headshot.png" alt={info.adminName} className="admin-profile-photo" />
                <span className="admin-status-dot-pulse"></span>
              </div>
              
              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <span className="admin-info-label">FULL NAME</span>
                  <span className="admin-info-value font-bold-value">{info.adminName}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">EMAIL ADDRESS</span>
                  <span className="admin-info-value font-medium-value-blue">{info.adminEmail}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">CURRENT STATUS</span>
                  <span className="admin-info-value">
                    <span className="admin-status-badge">
                      <span className="dot"></span>
                      ACTIVE
                    </span>
                  </span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">ACTIVATED DATE</span>
                  <span className="admin-info-value font-bold-value">{info.adminActivated}</span>
                </div>
              </div>
            </div>

            <div className="admin-card-actions-row">
              <button type="button" className="admin-action-btn-link">
                <i className="fa-solid fa-envelope"></i> Send Notification
              </button>
              <button type="button" className="admin-action-btn-link">
                <i className="fa-solid fa-clock-rotate-left"></i> Login Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionsView = () => (
    <div className="subscriptions-view-content">
      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="pricing-header">
            <span className="plan-name">Starter</span>
            <div className="plan-price">
              <span className="currency">$</span>
              <span className="amount">99</span>
              <span className="period">/month</span>
            </div>
            <p className="plan-desc">For small agencies getting started with automated screening.</p>
          </div>
          <div className="plan-features">
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Up to 10 active tenants</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> 1,000 prompt executions/mo</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Standard templates</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Email support</div>
          </div>
          <button type="button" className="btn-plan-action outline">Modify Plan</button>
        </div>

        <div className="pricing-card popular">
          <div className="popular-badge">Most Popular</div>
          <div className="pricing-header">
            <span className="plan-name">Professional</span>
            <div className="plan-price">
              <span className="currency">$</span>
              <span className="amount">299</span>
              <span className="period">/month</span>
            </div>
            <p className="plan-desc">For scaling teams with larger hiring volume.</p>
          </div>
          <div className="plan-features">
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Up to 50 active tenants</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> 10,000 prompt executions/mo</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Custom prompt templates</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Priority email/chat support</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Basic analytics dashboard</div>
          </div>
          <button type="button" className="btn-plan-action">Modify Plan</button>
        </div>

        <div className="pricing-card">
          <div className="pricing-header">
            <span className="plan-name">Enterprise</span>
            <div className="plan-price">
              <span className="amount">Custom Pricing</span>
            </div>
            <p className="plan-desc">For global enterprises requiring complete customizability and scale.</p>
          </div>
          <div className="plan-features">
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Unlimited active tenants</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Unlimited prompt executions</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Dedicated model fine-tuning</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> 24/7 phone & SLA support</div>
            <div className="feature-item"><i className="fa-solid fa-circle-check"></i> Advanced analytics & reports</div>
          </div>
          <button type="button" className="btn-plan-action outline">Contact Sales</button>
        </div>
      </div>
    </div>
  );

  const renderPromptsView = () => (
    <div className="dashboard-card full-width">
      <div className="card-header flex-between">
        <div className="header-search-wrapper" style={{ margin: 0, width: '320px', border: '1px solid #cbd5e1' }}>
          <i className="fa-solid fa-magnifying-glass header-search-icon"></i>
          <input 
            type="text" 
            className="header-search-input" 
            placeholder="Search templates..." 
          />
        </div>
        <button type="button" className="btn-save-changes" style={{ marginTop: 0, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-plus"></i> Create Template
        </button>
      </div>

      <div className="table-responsive" style={{ marginTop: '20px' }}>
        <table className="dashboard-table large">
          <thead>
            <tr>
              <th>Prompt ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Active Version</th>
              <th>Last Updated</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-muted">PRM-101</td>
              <td className="font-semibold">resume_screener</td>
              <td><span className="category-tag">Screening</span></td>
              <td>v2.1</td>
              <td>Jun 28, 2026</td>
              <td><span className="status-indicator status-active">Active</span></td>
              <td style={{ textAlign: 'right' }}>
                <button type="button" className="action-icon-btn" title="Edit Template"><i className="fa-solid fa-code"></i></button>
                <button type="button" className="action-icon-btn" title="Version History"><i className="fa-solid fa-clock-rotate-left"></i></button>
              </td>
            </tr>
            <tr>
              <td className="text-muted">PRM-102</td>
              <td className="font-semibold">interview_question_generator</td>
              <td><span className="category-tag">Interviews</span></td>
              <td>v1.0</td>
              <td>Jun 15, 2026</td>
              <td><span className="status-indicator status-active">Active</span></td>
              <td style={{ textAlign: 'right' }}>
                <button type="button" className="action-icon-btn" title="Edit Template"><i className="fa-solid fa-code"></i></button>
                <button type="button" className="action-icon-btn" title="Version History"><i className="fa-solid fa-clock-rotate-left"></i></button>
              </td>
            </tr>
            <tr>
              <td className="text-muted">PRM-103</td>
              <td className="font-semibold">candidate_email_responder</td>
              <td><span className="category-tag">Communications</span></td>
              <td>v1.4</td>
              <td>Jun 22, 2026</td>
              <td><span className="status-indicator status-draft">Draft</span></td>
              <td style={{ textAlign: 'right' }}>
                <button type="button" className="action-icon-btn" title="Edit Template"><i className="fa-solid fa-code"></i></button>
                <button type="button" className="action-icon-btn" title="Version History"><i className="fa-solid fa-clock-rotate-left"></i></button>
              </td>
            </tr>
            <tr>
              <td className="text-muted">PRM-104</td>
              <td className="font-semibold">job_description_optimizer</td>
              <td><span className="category-tag">Optimization</span></td>
              <td>v3.0</td>
              <td>May 10, 2026</td>
              <td><span className="status-indicator status-active">Active</span></td>
              <td style={{ textAlign: 'right' }}>
                <button type="button" className="action-icon-btn" title="Edit Template"><i className="fa-solid fa-code"></i></button>
                <button type="button" className="action-icon-btn" title="Version History"><i className="fa-solid fa-clock-rotate-left"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCreateTenantView = () => {
    const isEmailInUse = formAdminEmail.toLowerCase().trim() === 'jane@company.com';

    const handleConfirmSubmit = () => {
      if (isEmailInUse) {
        // Show the error alert!
        setShowConfirmModal(false);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 3000);
      } else {
        // Success flow!
        setShowConfirmModal(false);
        setShowSuccessAlert(true);
        
        // Return to list after delay
        setTimeout(() => {
          setShowSuccessAlert(false);
          setIsCreatingTenant(false);
          // Reset fields
          setFormCompany('TTB Media');
          setFormPlan('Professional - $499/mo');
          setFormDomain('acme');
          setFormAdminName('Jane Doe');
          setFormAdminEmail('jane@company.com');
        }, 3000);
      }
    };

    return (
      <div className="create-tenant-container" style={{ position: 'relative' }}>
        
        {/* Alerts Center */}
        <div className="alerts-fixed-container" style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 9999 }}>
          {showErrorAlert && (
            <div className="custom-toast-alert error-toast">
              <div className="toast-icon-wrapper red-icon-bg">
                <i className="fa-solid fa-circle-xmark"></i>
              </div>
              <div className="toast-message-content">
                <span className="toast-msg-title">Error system. Please try again</span>
              </div>
            </div>
          )}
          
          {showSuccessAlert && (
            <div className="custom-toast-alert success-toast">
              <div className="toast-icon-wrapper green-icon-bg">
                <i className="fa-solid fa-square-check"></i>
              </div>
              <div className="toast-message-content">
                <span className="toast-msg-title">Tenant create successfully.</span>
                <span className="toast-msg-desc">Activation email send to Tenant Admin</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Creation Card */}
        <div className="dashboard-card create-tenant-card" style={{ maxWidth: '800px', margin: '0 auto', padding: 0 }}>
          {/* Card Header */}
          <div className="card-header flex-between" style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
            <div className="create-header-titles">
              <h3 className="card-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Create New Tenant</h3>
              <p className="card-subtitle" style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Configure a new instance for your recruitment partner.</p>
            </div>
            <button 
              type="button" 
              className="action-icon-btn close-create-btn" 
              onClick={() => setIsCreatingTenant(false)}
              style={{ fontSize: '18px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Form Content */}
          <div className="create-form-body" style={{ padding: '32px' }}>
            <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              
              {/* Company Name */}
              <div className="form-group-item">
                <label className="form-label-caps">COMPANY NAME</label>
                <input 
                  type="text" 
                  className="form-input-custom" 
                  value={formCompany} 
                  onChange={(e) => setFormCompany(e.target.value)}
                />
              </div>

              {/* Subscription Plan */}
              <div className="form-group-item">
                <label className="form-label-caps">SUBSCRIPTION PLAN</label>
                <div className="select-custom-wrapper" style={{ position: 'relative' }}>
                  <select 
                    className="form-input-custom select-custom" 
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    style={{ appearance: 'none', paddingRight: '36px' }}
                  >
                    <option value="Professional - $499/mo">Professional - $499/mo</option>
                    <option value="Enterprise - $2499/mo">Enterprise - $2,499/mo</option>
                    <option value="Growth - $899/mo">Growth - $899/mo</option>
                    <option value="Basic - $99/mo">Basic - $99/mo</option>
                  </select>
                  <i className="fa-solid fa-chevron-down select-chevron-icon" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#64748b', pointerEvents: 'none' }}></i>
                </div>
              </div>
            </div>

            {/* Domain / Identifier */}
            <div className="form-group-item" style={{ marginBottom: '32px' }}>
              <label className="form-label-caps">DOMAIN / IDENTIFIER</label>
              <div className="input-with-suffix-wrapper" style={{ display: 'flex', position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input-custom input-domain-prefix" 
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  style={{ paddingRight: '110px' }}
                />
                <span className="input-domain-suffix" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                  .jobfusion.ai
                </span>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '0 0 32px' }} />

            {/* Tenant Administrator Title */}
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Tenant Administrator</h4>

            <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '16px' }}>
              
              {/* Admin Full Name */}
              <div className="form-group-item">
                <label className="form-label-caps">ADMIN FULL NAME</label>
                <input 
                  type="text" 
                  className="form-input-custom" 
                  value={formAdminName}
                  onChange={(e) => setFormAdminName(e.target.value)}
                />
              </div>

              {/* Admin Email */}
              <div className="form-group-item">
                <label className="form-label-caps">ADMIN EMAIL</label>
                <input 
                  type="email" 
                  className={`form-input-custom ${isEmailInUse ? 'has-error' : ''}`}
                  value={formAdminEmail}
                  onChange={(e) => setFormAdminEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Email Already in Use Error Label */}
            {isEmailInUse && (
              <div className="error-label-centered" style={{ textAlign: 'center', color: '#ea4335', fontSize: '13px', fontWeight: 600, marginTop: '24px' }}>
                This email address is already in use.
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="create-card-footer flex-end" style={{ padding: '24px 32px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              className="btn-cancel-custom" 
              onClick={() => setIsCreatingTenant(false)}
              style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700, color: '#ea4335', backgroundColor: '#ffffff', border: '1px solid #f87171', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-confirm-custom" 
              onClick={() => setShowConfirmModal(true)}
              style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700, color: '#ffffff', backgroundColor: '#ea4335', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Confirm
            </button>
          </div>
        </div>

        {/* Confirm Modal Backdrop Overlay */}
        {showConfirmModal && (
          <div className="modal-backdrop-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div className="confirm-popup-card" style={{ width: '400px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', padding: 0 }}>
              
              {/* Modal Header */}
              <div className="modal-header flex-between" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Confirm Action</span>
                <button 
                  type="button" 
                  className="close-modal-btn" 
                  onClick={() => setShowConfirmModal(false)}
                  style={{ fontSize: '16px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body" style={{ padding: '24px', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Are you sure you want to proceed? This action will trigger the next step in the recruitment workflow. Your changes will not be saved.
              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn-cancel-custom" 
                  onClick={() => setShowConfirmModal(false)}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#ea4335', backgroundColor: '#ffffff', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-confirm-custom" 
                  onClick={handleConfirmSubmit}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#ffffff', backgroundColor: '#ea4335', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Confirm
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <>
      {activeSidebarMenu === 'dashboard' && renderDashboardView()}
      {activeSidebarMenu === 'tenants' && (
        isCreatingTenant ? renderCreateTenantView() :
        selectedTenant ? renderTenantDetailView(selectedTenant) : renderTenantsView()
      )}
      {activeSidebarMenu === 'subscriptions' && renderSubscriptionsView()}
      {activeSidebarMenu === 'prompts' && renderPromptsView()}
    </>
  );
}
