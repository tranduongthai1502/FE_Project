import { usePromptManagementController, type PromptManagementController } from '@/features/admin/application/hooks/usePromptManagementController'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { MetricCard } from '@/core/components/MetricCard'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'
import { EditIcon } from '@/core/components/Icons'

function CreatePromptView({ ctrl }: { ctrl: PromptManagementController }) {
  return (
    <form
      className="role-content create-prompt-content"
      onSubmit={ctrl.handleCreateSubmit}
    >
      <Breadcrumb
        className="create-plan-breadcrumb"
        items={[
          { label: 'Home', onClick: ctrl.onHome },
          { label: 'Prompt Management', onClick: ctrl.closePromptCreate },
          { label: 'Create New Prompt' },
        ]}
      />

      <div className="create-prompt-layout">
        <aside className="create-prompt-sidebar">
          <section className="create-prompt-card">
            <h2>General Settings</h2>
            <label>
              <span>Internal Name</span>
              <input value={ctrl.internalName} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => ctrl.setInternalName(event.target.value)} placeholder="e.g., xinquiU9" required />
            </label>
            <label>
              <span>Description</span>
              <textarea value={ctrl.description} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => ctrl.setDescription(event.target.value)} placeholder="Describe the purpose of this prompt..." />
            </label>
          </section>

          <section className="create-prompt-card">
            <h2>AI ModelConfig</h2>
            <label>
              <span>Primary Model</span>
              <ScrollableSelect
                ariaLabel="Select primary model"
                value={ctrl.model}
                options={[
                  { value: 'Gemini 1.5 Pro', label: 'Gemini 1.5 Pro' },
                  { value: 'GPT-4.1', label: 'GPT-4.1' },
                  { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
                ]}
                onChange={ctrl.setModel}
              />
            </label>
            <label>
              <span>Max Output Tokens</span>
              <input value={ctrl.maxTokens} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => ctrl.setMaxTokens(event.target.value)} inputMode="numeric" />
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
              {Array.from({ length: ctrl.lineCount }, (_, index) => <li key={index}>{index + 1}</li>)}
            </ol>
            <textarea value={ctrl.instructions} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(event) => ctrl.setInstructions(event.target.value)} spellCheck={false} />
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
        <button type="button" onClick={ctrl.closePromptCreate}>Cancel</button>
        <button type="submit">Save Changes</button>
      </footer>
    </form>
  )
}

export function PromptManagementView({ onHome }: { onHome?: () => void }) {
  const ctrl = usePromptManagementController({ onHome })

  if (ctrl.activeView === 'create') {
    return <CreatePromptView ctrl={ctrl} />
  }

  return (
    <div className="role-content prompt-management-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Prompt Management' }]} />

      <div className="subscription-title-row prompt-title-row">
        <div>
          <h1>Prompt Management</h1>
          <p>Configure and optimize core AI instructions across the platform.</p>
        </div>
        <button type="button" onClick={ctrl.openPromptCreate}>Create New Prompt</button>
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
        {ctrl.prompts.map(([name, feature, module, date, status]) => (
          <div className="prompt-table-row" key={name}>
            <span className="table-name-tooltip" data-tooltip={name} title={name} tabIndex={0}>
              <strong>{name}</strong>
            </span>
            <span>{feature}</span>
            <span>{module}</span>
            <span>{date}</span>
            <em className={status === 'Active' ? 'active' : 'inactive'}>{status}</em>
            <button type="button" className="icon-tooltip" aria-label={`Edit ${name}`} data-tooltip="Edit">
              <EditIcon />
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
