import { getAppErrorMessage } from '../../../utils/errorManager'

export function getAdminErrorMessage(error: unknown, fallbackMessage: string) {
  return getAppErrorMessage(error, fallbackMessage)
}
