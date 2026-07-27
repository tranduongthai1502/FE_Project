export function stripCurrencyGrouping(value: string) {
  return value.replace(/,/g, '').trim()
}

export function formatCurrencyInput(value: string) {
  const withoutCommas = stripCurrencyGrouping(value)
  const sanitized = withoutCommas
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1')

  if (!sanitized) return ''

  const [integerPart = '', decimalPart] = sanitized.split('.')
  const groupedInteger = integerPart.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const safeInteger = groupedInteger || '0'

  if (decimalPart !== undefined) {
    return `${safeInteger}.${decimalPart.slice(0, 2)}`
  }

  return safeInteger
}

export function parseCurrencyInput(value: string) {
  const numericValue = Number(stripCurrencyGrouping(value))
  return Number.isFinite(numericValue) ? numericValue : 0
}
