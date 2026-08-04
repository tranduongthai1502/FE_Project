export type PasswordStrength = {
  requirements: {
    length: boolean
    case: boolean
    number: boolean
    special: boolean
  }
  score: number
  strengthLabel: string
  strengthClass: string
  progressWidth: string
}

export type AdminPasswordStrength = Omit<PasswordStrength, 'progressWidth'>
export type PasswordRequirementKey = keyof PasswordStrength['requirements']

export const passwordRequirementLabels: Record<PasswordRequirementKey, string> = {
  length: 'At least 8 characters',
  case: 'Uppercase and lowercase letters',
  number: 'At least 1 number',
  special: 'At least 1 symbol',
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^\p{L}\p{N}\s]/u.test(password),
  }

  const score = Object.values(requirements).filter(Boolean).length

  let strengthLabel = 'Weak'
  let strengthClass = 'weak'
  let progressWidth = '25%'

  if (score === 3) {
    strengthLabel = 'Medium'
    strengthClass = 'medium'
    progressWidth = '60%'
  } else if (score === 4) {
    strengthLabel = 'Strong'
    strengthClass = 'strong'
    progressWidth = '100%'
  }

  return { requirements, score, strengthLabel, strengthClass, progressWidth }
}

export function getAdminPasswordStrength(password: string): AdminPasswordStrength {
  const { requirements, score, strengthLabel, strengthClass } = getPasswordStrength(password)

  if (!password) {
    return {
      requirements,
      score,
      strengthLabel: 'Weak',
      strengthClass: 'weak',
    }
  }

  return { requirements, score, strengthLabel, strengthClass }
}

export function getMissingPasswordRequirementLabels(password: string) {
  const { requirements } = getPasswordStrength(password)

  return (Object.entries(requirements) as Array<[PasswordRequirementKey, boolean]>)
    .filter(([, isMet]) => !isMet)
    .map(([requirement]) => passwordRequirementLabels[requirement])
}
