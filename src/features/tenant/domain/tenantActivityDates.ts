const vietnamTimeZone = 'Asia/Ho_Chi_Minh'

export const ACTIVITY_LOG_PAGE_SIZE = 5

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getDefaultActivityDateRange() {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 30)

  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(endDate),
  }
}

export function formatActivityDateTime(value?: string) {
  if (!value) return '-'

  const normalizedValue = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim())
    ? value
    : `${value.trim()}Z`
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return value

  const vietnamDateFormatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: vietnamTimeZone,
    year: 'numeric',
  })
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const activityDateKey = vietnamDateFormatter.format(date)
  const todayDateKey = vietnamDateFormatter.format(today)
  const yesterdayDateKey = vietnamDateFormatter.format(yesterday)
  const dateLabel = activityDateKey === todayDateKey
    ? 'TODAY'
    : activityDateKey === yesterdayDateKey
      ? 'YESTERDAY'
      : date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        timeZone: vietnamTimeZone,
      }).toUpperCase()
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: vietnamTimeZone,
  })

  return `${dateLabel} • ${timeLabel}`
}
