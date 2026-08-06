import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPromptCreatePath, getSuperAdminViewPath, isPromptCreateUrl } from '../../domain/superAdminRouteHelpers'

export function usePromptManagementController({ onHome }: { onHome?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeView, setActiveView] = useState<'list' | 'create'>(() => (
    isPromptCreateUrl(location.pathname) ? 'create' : 'list'
  ))

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
    navigate(getSuperAdminViewPath('prompt-management'))
  }

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    closePromptCreate()
  }

  return {
    onHome,
    activeView,
    prompts,
    openPromptCreate,
    closePromptCreate,
    handleCreateSubmit,

    // Form States & Handlers for Create View
    internalName,
    setInternalName,
    description,
    setDescription,
    model,
    setModel,
    maxTokens,
    setMaxTokens,
    instructions,
    setInstructions,
    lineCount,
  }
}

export type PromptManagementController = ReturnType<typeof usePromptManagementController>
