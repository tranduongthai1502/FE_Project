import {
  getBackendErrorMessage,
  getErrorCode,
  getErrorRawMessage,
} from '@/core/api/axiosErrorHandler'

export type FieldErrorRule<TField extends string> = {
  field: TField
  message: string
  keywords: string[]
}

export function getFieldErrorSearchText(error: unknown, message = '') {
  return [
    getErrorCode(error),
    getBackendErrorMessage(error),
    getErrorRawMessage(error),
    message,
  ].join(' ').toLowerCase()
}

export function mapErrorTextToFieldErrors<TField extends string>(
  error: unknown,
  message: string,
  rules: FieldErrorRule<TField>[],
): Partial<Record<TField, string>> {
  const rawErrorText = getFieldErrorSearchText(error, message)
  const matchedRule = rules.find((rule) => rule.keywords.some((keyword) => rawErrorText.includes(keyword.toLowerCase())))

  return matchedRule ? { [matchedRule.field]: matchedRule.message } as Partial<Record<TField, string>> : {}
}

export function buildMaxLengthMessage(fieldName: string, maxLength: number) {
  return `${fieldName} must be ${maxLength} characters or less.`
}

export function addRequiredFieldErrors<TField extends string, TValues extends Partial<Record<TField, string>>>(
  values: TValues,
  fields: TField[],
  errors: Partial<Record<TField, string>>,
  message: string,
) {
  fields.forEach((field) => {
    if (!String(values[field] || '').trim()) {
      errors[field] = message
    }
  })
}
