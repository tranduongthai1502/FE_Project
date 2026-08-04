export const MAX_CRITERIA_COUNT = 20
export const CRITERIA_CATEGORIES = ['Technical Skills', 'Experience', 'Education', 'Soft Skills', 'Culture Fit']

export function normalizeWeightInput(value: string): string {
  const withoutPercent = value.replace(/%/g, '').replace(',', '.')
  const numericOnly = withoutPercent.replace(/[^\d.]/g, '')
  const [whole = '', ...decimalParts] = numericOnly.split('.')
  const decimal = decimalParts.join('').slice(0, 1)

  return decimalParts.length > 0 ? `${whole}.${decimal}` : whole
}

export function isValidCriteriaCount(count: number): boolean {
  return count >= 0 && count <= MAX_CRITERIA_COUNT
}

export function calculateTotalCriteriaWeight(weights: Array<string | number>): number {
  return weights.reduce<number>((sum, w) => {
    const num = typeof w === 'number' ? w : parseFloat(normalizeWeightInput(String(w)))
    return sum + (Number.isFinite(num) ? num : 0)
  }, 0)
}

export function isCriteriaWeight100Percent(weights: Array<string | number>): boolean {
  const total = calculateTotalCriteriaWeight(weights)
  return Math.abs(total - 100) < 0.01
}
