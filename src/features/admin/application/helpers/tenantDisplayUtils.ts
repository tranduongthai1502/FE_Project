export function getTenantStatusMeta(status?: string): { label: string; className: string } {
  const normalizedStatus = String(status || '').trim().toLowerCase()

  if (normalizedStatus === 'active') {
    return { label: 'Active', className: 'active' }
  }

  if (normalizedStatus.includes('expir')) {
    return { label: 'Expiring', className: 'expiring' }
  }

  return { label: 'Inactive', className: 'inactive' }
}

export function formatDashboardPercent(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '0%'
  const clampedValue = Math.max(0, Math.min(100, value))
  const formatted = clampedValue % 1 === 0 ? clampedValue.toFixed(0) : clampedValue.toFixed(1)
  return `${formatted}%`
}

export function getRemainingLabel(count: number, unitSingular: string, isUnlimited: boolean): string {
  if (isUnlimited) return 'Unlimited'
  if (count <= 0) return `0 ${unitSingular} remaining`

  return `${count} ${unitSingular} remaining`
}
