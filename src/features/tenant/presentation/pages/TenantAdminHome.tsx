import type { CSSProperties } from 'react'
import { MetricCard } from '@/core/components/MetricCard'

type TenantAdminHomeProps = {
  isStaffQuotaUnlimited: boolean
  staffQuotaDescription: string
  staffQuotaPercent: number
  staffQuotaRingLabel: string
  staffQuotaSummary: string
}

export function TenantAdminHome({
  isStaffQuotaUnlimited,
  staffQuotaDescription,
  staffQuotaPercent,
  staffQuotaRingLabel,
  staffQuotaSummary,
}: TenantAdminHomeProps) {
  return (
    <div className="role-content">
      <div className="role-metrics four tenant-dashboard-metrics">
        <MetricCard icon="fa-briefcase" label="Active Job Postings" value="24" note="+12%" />
        <MetricCard icon="fa-users" label="Total Applicants" value="842" note="+0 this week" />
        <MetricCard icon="fa-clock" label="Time-to-Hire" value="18 Days" note="-3d" />
        <MetricCard icon="fa-calendar-check" label="Interviews Today" value="5" note="Today" />
      </div>

      <div className="tenant-dashboard-grid">
        <div className="tenant-dashboard-top">
          <section className="role-panel funnel-panel">
            <div className="role-panel-head">
              <div>
                <h2>Recruitment Funnel</h2>
                <p>Applicant conversion through hiring stages</p>
              </div>
              <a href="#reports">View Detailed Report <i className="fa-solid fa-arrow-right"></i></a>
            </div>
            {[
              ['Applied', '143', '98%'],
              ['Screening', '89', '65%'],
              ['Shortlisted', '42', '29%'],
              ['Interviewing', '21', '15%'],
              ['Offered', '6', '5%'],
            ].map(([label, value, width]) => (
              <div className="funnel-row" key={label}>
                <div><span>{label}</span><strong>{value}</strong></div>
                <span className="funnel-track"><span style={{ width }} /></span>
              </div>
            ))}
          </section>

          <div className="tenant-dashboard-top-side">
            <section className={`role-panel quota-panel ${isStaffQuotaUnlimited ? 'quota-panel-unlimited' : ''}`}>
              <div className="role-panel-head"><h2>Staff Quota</h2><small>{staffQuotaSummary}</small></div>
              <div className="quota-ring" style={{ '--quota-percent': `${staffQuotaPercent}%` } as CSSProperties}>
                <strong>{staffQuotaRingLabel}</strong>
                <span>Used</span>
              </div>
              <p>{staffQuotaDescription}</p>
            </section>
          </div>
        </div>

        <div className="tenant-dashboard-bottom">
          <section className="role-panel interview-list">
            <div className="role-panel-head">
              <div><h2>Upcoming Interviews</h2><p>Scheduled for today & tomorrow</p></div>
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </div>
            {[
              { initials: 'SJ', name: 'Sarah Jenkins', role: 'Senior DevOps Engineer', interviewer: 'David Chen', time: '10:00 AM', wait: 'In 45 mins' },
              { initials: 'MT', name: 'Marcus Thorne', role: 'Product Manager', interviewer: 'Elena Rodriguez', time: '02:30 PM', wait: 'Today' },
            ].map((item) => (
              <article key={item.name}>
                <span className="role-avatar">{item.initials}</span>
                <div className="interview-candidate">
                  <strong>{item.name}</strong>
                  <small>{item.role}</small>
                </div>
                <div className="interview-interviewer">
                  <small>Interviewer</small>
                  <strong>{item.interviewer}</strong>
                </div>
                <em>
                  {item.time}
                  <small>{item.wait}</small>
                </em>
              </article>
            ))}
          </section>

          <section className="role-panel insights-panel">
            <h2>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19Z" fill="#F24E1E" />
              </svg>
              AI Insights (DSS)
            </h2>
            <div className="tag-list">
              <span>Cloud Architecture <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
              <span>Go Lang <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
              <span className="tag-muted">Data Security</span>
            </div>
            <small>Difficult to fill positions</small>
            <div className="insight-row"><span>Senior DevOps Engineer</span><strong>43 Days Open</strong></div>
            <div className="insight-row"><span>ML Ops Specialist</span><strong>31 Days Open</strong></div>
            <button type="button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g clipPath="url(#ai-report-chart-icon)">
                  <path d="M15 10H12V3H15V10ZM0 8H3V13H0V8ZM11 12H10V13H8V0H11V12ZM4 3H7V13H4V3ZM16 13V14H14V16H13V14H11V13H13V11H14V13H16Z" fill="#0B1C30" fillOpacity="0.9" />
                </g>
                <defs>
                  <clipPath id="ai-report-chart-icon">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              View full AI report <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
