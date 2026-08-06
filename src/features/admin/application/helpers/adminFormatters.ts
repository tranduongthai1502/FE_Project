export function formatPlanDate(dateValue?: string): string {
  if (!dateValue) return ''
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatFeatureLabel(featureKey: string): string {
  const normalizedKey = featureKey.trim().toUpperCase()
  const labelMap: Record<string, string> = {
    AI_JD_GENERATOR: 'AI JD Generator',
    AI_CV_PARSER: 'AI CV Parser',
    AI_TALENT_MATCHING: 'AI Talent Matching',
    AI_SCREENING_CHATBOT: 'AI Screening Chatbot',
    DSS_ANALYTICS: 'DSS Analytics Engine',
    PRIORITY_SUPPORT: '24/7 Priority Support',
  }

  return labelMap[normalizedKey] || featureKey
}
