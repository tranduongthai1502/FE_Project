export function getNormalizedJobStatus(status?: string): string {
  return String(status || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

export function isOpenJobStatus(status?: string): boolean {
  const normalized = getNormalizedJobStatus(status)
  return normalized === 'OPEN' || normalized === 'ACTIVE'
}

export function isClosedJobStatus(status?: string): boolean {
  const normalized = getNormalizedJobStatus(status)
  return normalized === 'CLOSED' || normalized === 'CLOSE'
}

export function isDraftJobStatus(status?: string): boolean {
  return getNormalizedJobStatus(status) === 'DRAFT'
}

export function isValidSalaryRange(salaryMin?: number, salaryMax?: number): boolean {
  if (salaryMin !== undefined && salaryMin < 0) return false
  if (salaryMax !== undefined && salaryMax < 0) return false
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > 0 && salaryMax > 0) {
    return salaryMax >= salaryMin
  }
  return true
}

export function isValidApplicationDeadline(deadlineStr?: string, nowMs: number = Date.now()): boolean {
  if (!deadlineStr || !deadlineStr.trim()) return false
  const deadlineDate = Date.parse(deadlineStr)
  if (Number.isNaN(deadlineDate)) return false

  const startOfToday = new Date(nowMs)
  startOfToday.setHours(0, 0, 0, 0)
  
  return deadlineDate >= startOfToday.getTime()
}
