import { useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import styles from './InterviewManagementView.module.css'

type InterviewStatus = 'Scheduled' | 'Completed' | 'No-show' | 'Cancelled'

const interviews: Array<{
  id: string
  candidate: string
  email: string
  job: string
  department: string
  interviewer: string
  date: string
  time: string
  format: 'Online' | 'Offline'
  status: InterviewStatus
  day: number
}> = [
  { id: 'int-1', candidate: 'Alex Rivera', email: 'alex.rivera@example.com', job: 'Senior Product Designer', department: 'Design Team', interviewer: 'ConbeMeo', date: 'Jul 31, 2026', time: '10:30 AM - 11:00 AM', format: 'Online', status: 'Scheduled', day: 31 },
  { id: 'int-2', candidate: 'Maya Thompson', email: 'm.thompson@webstack.io', job: 'Staff Engineer', department: 'Infrastructure', interviewer: 'Xinhdep', date: 'Jul 29, 2026', time: '10:30 AM - 11:00 AM', format: 'Offline', status: 'Completed', day: 29 },
  { id: 'int-3', candidate: 'Sarah Connor', email: 's.connor@cyberdyne.net', job: 'QA Automation Lead', department: 'Engineering', interviewer: 'Cuaongbo', date: 'Jul 29, 2026', time: '9:30 AM - 10:00 AM', format: 'Online', status: 'No-show', day: 29 },
  { id: 'int-4', candidate: 'Sarah Connor', email: 's.connor@cyberdyne.net', job: 'QA Automation Lead', department: 'Engineering', interviewer: 'Nhosoimeo', date: 'Jul 29, 2026', time: '9:30 AM - 10:00 AM', format: 'Offline', status: 'Cancelled', day: 29 },
  { id: 'int-5', candidate: 'Sarah Connor', email: 's.connor@cyberdyne.net', job: 'QA Automation Lead', department: 'Engineering', interviewer: 'Moimoi Nganngan', date: 'Jul 29, 2026', time: '9:30 AM - 10:00 AM', format: 'Offline', status: 'Cancelled', day: 29 },
]

const calendarEvents = [
  { id: 'cal-1', date: '2026-07-02T10:30:00', name: 'Maya Thompson', note: '10:30 AM - Completed', job: 'Sr. Product Designer', tone: 'green' },
  { id: 'cal-2', date: '2026-07-04T14:00:00', name: 'John Smith', note: '02:00 PM - Cancelled', job: 'Sr. Product Designer', tone: 'blue' },
  { id: 'cal-3', date: '2026-07-11T10:30:00', name: 'Alex Rivera', note: '10:30 AM - Scheduled', job: 'Sr. Product Designer', tone: 'orange' },
  { id: 'cal-4', date: '2026-07-12T10:30:00', name: 'Jordan S.', note: '10:30 AM - Scheduled', job: 'Sr. Product Designer', tone: 'orange' },
  { id: 'cal-5', date: '2026-07-16T10:30:00', name: 'Alex Rivera', note: '10:30 AM - Scheduled', job: 'Sr. Product Designer', tone: 'orange' },
  { id: 'cal-6', date: '2026-07-17T10:30:00', name: 'Jordan S.', note: '10:30 AM - Scheduled', job: 'Sr. Product Designer', tone: 'orange' },
  { id: 'cal-7', date: '2026-07-26T10:30:00', name: 'Alex Rivera', note: '10:30 AM - Scheduled', job: 'Sr. Product Designer', tone: 'orange' },
  { id: 'cal-8', date: '2026-07-27T10:30:00', name: 'Jordan S.', note: '10:30 AM - Scheduled', job: 'Sr. Product Designer', tone: 'orange' },
]

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getStatusClass(status: InterviewStatus) {
  if (status === 'Completed') return styles.statusCompleted
  if (status === 'No-show') return styles.statusNoShow
  if (status === 'Cancelled') return styles.statusCancelled
  return styles.statusScheduled
}

export function InterviewManagementView() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarTitle, setCalendarTitle] = useState('July 2026')
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth')
  const [calendarDate, setCalendarDate] = useState('2026-07-01')
  const fullCalendarEvents = useMemo(() => calendarEvents.map((event) => ({
    id: event.id,
    title: `${event.name} - ${event.note}`,
    start: event.date,
    classNames: [styles.calendarEvent, styles[event.tone as 'green' | 'blue' | 'orange'] || styles.orange],
    extendedProps: {
      note: event.note,
      job: event.job,
      tone: event.tone,
    },
  })), [])

  const changeCalendarView = (nextView: typeof calendarView) => {
    setCalendarView(nextView)
    setCalendarTitle(nextView === 'timeGridDay' ? 'July 1, 2026' : nextView === 'timeGridWeek' ? 'Jun 28 - Jul 4, 2026' : 'July 2026')
  }
  const goToToday = () => {
    const today = new Date().toISOString().slice(0, 10)
    setCalendarDate(today)
    setCalendarTitle(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
  }

  return (
    <div className={`role-content ${styles.interviewPage}`}>
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Interviews', current: true }]} />

      <header className={styles.header}>
        <div>
          <h1>Interview Management</h1>
          <p>Monitor, schedule, and evaluate your recruitment flow across all departments.</p>
        </div>
        <button type="button" className={styles.primaryButton}>Schedule Interview</button>
      </header>

      <section className={styles.metrics}>
        <article><span><i className="fa-solid fa-calendar-day"></i></span><div><small>Upcoming Today</small><strong>08</strong><p>Next: 10:30 AM with Jordan S.</p></div></article>
        <article><span><i className="fa-solid fa-clipboard-question"></i></span><div><small>Pending Evaluations</small><strong>14</strong><p>Average wait time: 2.4 days</p></div></article>
        <article><span><i className="fa-solid fa-circle-check"></i></span><div><small>Completed This Week</small><strong>24</strong><p>6 hires confirmed so far</p></div></article>
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <label className={styles.search}><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Search job title, or department..." /></label>
          <div className={styles.viewToggle}>
            <button type="button" className={viewMode === 'list' ? styles.active : ''} onClick={() => setViewMode('list')}><i className="fa-solid fa-list"></i>List View</button>
            <button type="button" className={viewMode === 'calendar' ? styles.active : ''} onClick={() => setViewMode('calendar')}><i className="fa-regular fa-calendar"></i>Calendar View</button>
          </div>
          <button type="button" className={styles.selectButton}>Job Position: All<i className="fa-solid fa-chevron-down"></i></button>
          <button type="button" className={styles.selectButton}>Status: All<i className="fa-solid fa-chevron-down"></i></button>
          {viewMode === 'list' ? (
            <button type="button" className={styles.selectButton}><i className="fa-regular fa-calendar"></i>Oct 12 - Oct 19, 2023</button>
          ) : (
            <button type="button" className={styles.todayButton} onClick={goToToday}>Today</button>
          )}
        </div>

        {viewMode === 'list' ? (
          <>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Candidate</span><span>Job Posting</span><span>Interviewer</span><span>Date & Time</span><span>Format</span><span>Status</span><span>Actions</span>
              </div>
              {interviews.map((item) => (
                <div className={styles.tableRow} key={item.id}>
                  <span className={styles.person}><b>{getInitials(item.candidate)}</b><span><strong>{item.candidate}</strong><small>{item.email}</small></span></span>
                  <span><strong>{item.job}</strong><small>{item.department}</small></span>
                  <span className={styles.person}><b>{getInitials(item.interviewer)}</b><strong>{item.interviewer}</strong></span>
                  <span><strong>{item.date}</strong><small>{item.time}</small></span>
                  <span><i className={`fa-solid ${item.format === 'Online' ? 'fa-video' : 'fa-user-group'}`}></i>{item.format}</span>
                  <span className={`${styles.status} ${getStatusClass(item.status)}`}><i className="fa-solid fa-circle"></i>{item.status}</span>
                  <span className={styles.actions}><button type="button"><i className="fa-regular fa-pen-to-square"></i></button><button type="button"><i className="fa-regular fa-trash-can"></i></button></span>
                </div>
              ))}
            </div>
            <footer className={styles.footer}><span>Showing 5 of 8 interviews</span><div><button disabled>{'<'}</button><button className={styles.activePage}>1</button><button>2</button><button>{'>'}</button></div></footer>
          </>
        ) : (
          <div className={styles.calendarWrap}>
            <div className={styles.calendarControls}>
              <button type="button" className={calendarView === 'timeGridDay' ? styles.active : undefined} onClick={() => changeCalendarView('timeGridDay')}>Day</button>
              <button type="button" className={calendarView === 'timeGridWeek' ? styles.active : undefined} onClick={() => changeCalendarView('timeGridWeek')}>Week</button>
              <button type="button" className={calendarView === 'dayGridMonth' ? styles.active : undefined} onClick={() => changeCalendarView('dayGridMonth')}>Month</button>
              <span>{calendarTitle}</span>
            </div>
            <div className={styles.fullCalendarShell}>
              <FullCalendar
                key={`${calendarView}-${calendarDate}`}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={calendarView}
                initialDate={calendarDate}
                headerToolbar={false}
                height="auto"
                dayMaxEvents={3}
                events={fullCalendarEvents}
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: 'short',
                }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
