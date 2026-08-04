export function DashboardPreview() {
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
