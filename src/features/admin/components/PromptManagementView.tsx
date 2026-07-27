import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPromptCreatePath, getSuperAdminViewPath, isPromptCreateUrl } from '@/app/routes/superAdminRouteHelpers'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { MetricCard } from '@/components/common/MetricCard'
import { ScrollableSelect } from '@/components/common/ScrollableSelect'
import { FIELD_LENGTH_LIMITS } from '@/services/api/axiosErrorHandler'

function CreatePromptView({ onBack, onHome }: { onBack: () => void; onHome?: () => void }) {
  const [internalName, setInternalName] = useState('xinquiU9')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('Gemini 1.5 Pro')
  const [maxTokens, setMaxTokens] = useState('1024')
  const [instructions, setInstructions] = useState(`# System Persona
You are a highly experienced
Recruitment Consultant and Copywriter
for JobFusion. Your goal is to produce
job descriptions that are engaging,
SEO-optimized, and free of bias.`)

  const lineCount = Math.max(40, instructions.split('\n').length + 6)

  return (
    <form
      className="role-content create-prompt-content"
      onSubmit={(event) => {
        event.preventDefault()
        onBack()
      }}
    >
      <Breadcrumb
        className="create-plan-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Prompt Management', onClick: onBack },
          { label: 'Create New Prompt' },
        ]}
      />

      <div className="create-prompt-layout">
        <aside className="create-prompt-sidebar">
          <section className="create-prompt-card">
            <h2>General Settings</h2>
            <label>
              <span>Internal Name</span>
              <input value={internalName} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => setInternalName(event.target.value)} placeholder="e.g., xinquiU9" required />
            </label>
            <label>
              <span>Description</span>
              <textarea value={description} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the purpose of this prompt..." />
            </label>
          </section>

          <section className="create-prompt-card">
            <h2>AI ModelConfig</h2>
            <label>
              <span>Primary Model</span>
              <ScrollableSelect
                ariaLabel="Select primary model"
                value={model}
                options={[
                  { value: 'Gemini 1.5 Pro', label: 'Gemini 1.5 Pro' },
                  { value: 'GPT-4.1', label: 'GPT-4.1' },
                  { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
                ]}
                onChange={setModel}
              />
            </label>
            <label>
              <span>Max Output Tokens</span>
              <input value={maxTokens} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => setMaxTokens(event.target.value)} inputMode="numeric" />
            </label>
          </section>
          <p className="create-prompt-deploy">Not yet deployed</p>
        </aside>

        <section className="prompt-editor-panel">
          <header>
            <h2><i className="fa-solid fa-terminal"></i> System Role & Instructions</h2>
            <div><i className="fa-regular fa-copy"></i><i className="fa-solid fa-expand"></i></div>
          </header>
          <div className="prompt-code-editor">
            <ol aria-hidden="true">
              {Array.from({ length: lineCount }, (_, index) => <li key={index}>{index + 1}</li>)}
            </ol>
            <textarea value={instructions} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => setInstructions(event.target.value)} spellCheck={false} />
          </div>
          <footer>
            <input placeholder="Typing..." maxLength={FIELD_LENGTH_LIMITS.defaultText}/>
          </footer>
        </section>

        <aside className="prompt-version-panel">
          <h2>Version History</h2>
          <div className="prompt-empty-history">
            <span><i className="fa-regular fa-folder-open"></i></span>
            <strong>No version history yet.</strong>
            <p>Versions will appear here once you save your first draft.</p>
          </div>
          <div className="prompt-ai-tip">
            <strong><i className="fa-solid fa-wand-magic-sparkles"></i> AI Optimizer</strong>
            <p>Write your instructions first, then click "Test Prompt" to analyze token usage and efficiency.</p>
          </div>
        </aside>
      </div>

      <footer className="create-prompt-actions">
        <button type="button" onClick={onBack}>Cancel</button>
        <button type="submit">Save Changes</button>
      </footer>
    </form>
  )
}

export function PromptManagementView({ onHome }: { onHome?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<'list' | 'create'>(() => (
    isPromptCreateUrl(location.pathname) ? 'create' : 'list'
  ))
  const prompts = [
    ['JD Generator', 'Structural role description creator', 'Recruitment Module', 'Today, 09:42 AM', 'Active'],
    ['AI CV Parsing', 'JSON extraction from PDF/Docx', 'Talent Module', 'Yesterday, 4:15 PM', 'Active'],
    ['Chatbot Screening', 'Initial candidate engagement flow', 'Interview Module', '2 days ago', 'Inactive'],
    ['DSS Analytics', 'Decision Support System Scoring', 'Analytics Module', '3 weeks ago', 'Active'],
    ['Priority Support', 'Priority Support really joelman', 'Priority Module', '4 weeks ago', 'Active'],
  ]

  useEffect(() => {
    setActiveView(isPromptCreateUrl(location.pathname) ? 'create' : 'list')
  }, [location.pathname])

  const openPromptCreate = () => {
    setActiveView('create')
    navigate(getPromptCreatePath())
  }

  const closePromptCreate = () => {
    setActiveView('list')
    navigate(getSuperAdminViewPath('promptManagement'))
  }

  if (activeView === 'create') {
    return <CreatePromptView onBack={closePromptCreate} onHome={onHome} />
  }

  return (
    <div className="role-content prompt-management-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Prompt Management' }]} />

      <div className="subscription-title-row prompt-title-row">
        <div>
          <h1>Prompt Management</h1>
          <p>Configure and optimize core AI instructions across the platform.</p>
        </div>
        <button type="button" onClick={openPromptCreate}>Create New Prompt</button>
      </div>

      <div className="role-metrics prompt-management-metrics">
        <MetricCard
          className="prompt-summary-card"
          icon="fa-code-branch"
          label="Total Prompts"
          value="08"
          note="Updated 2h ago"
        />
        <MetricCard
          className="prompt-summary-card system-health-card"
          icon="fa-shield-halved"
          label="System Health"
          value={<><b>6</b><span>Optimal</span><b>2</b><span>Review</span></>}
          note={<><i></i><i></i></>}
        />
        <MetricCard
          className="prompt-summary-card latency-card"
          icon="fa-gauge-high"
          label="Global Latency"
          value="184ms"
          note={<i className="latency-line" aria-hidden="true"></i>}
        />
      </div>

      <section className="prompt-table-card">
        <div className="prompt-table-row prompt-table-head">
          <span>Prompt Name</span>
          <span>Associated AI Feature</span>
          <span>Module</span>
          <span>Last Modified Date</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {prompts.map(([name, feature, module, date, status]) => (
          <div className="prompt-table-row" key={name}>
            <span className="table-name-tooltip" data-tooltip={name} title={name} tabIndex={0}>
              <strong>{name}</strong>
            </span>
            <span>{feature}</span>
            <span>{module}</span>
            <span>{date}</span>
            <em className={status === 'Active' ? 'active' : 'inactive'}>{status}</em>
            <button type="button" className="icon-tooltip" aria-label={`Edit ${name}`} data-tooltip="Edit">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.75 26.25H26.25" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.5 7.5L22.5 12.5" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
        <footer>
          <span>Showing 5 of 8 prompt</span>
          <div><button type="button" className="icon-tooltip" data-tooltip="Previous page"><i className="fa-solid fa-chevron-left"></i></button><button type="button" className="active">1</button><button type="button">2</button><button type="button" className="icon-tooltip" data-tooltip="Next page"><i className="fa-solid fa-chevron-right"></i></button></div>
        </footer>
      </section>

      <div className="prompt-sync-footer">
        <span><i className="fa-solid fa-rotate"></i> Global AI nodes are synchronizing changes...</span>
        <span>Match Accuracy: 98.4%</span>
      </div>
    </div>
  )
}
