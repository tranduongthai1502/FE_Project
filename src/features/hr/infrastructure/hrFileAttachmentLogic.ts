import { buildMaxLengthMessage } from '@/core/utils/errors/fieldErrorUtils'

const maxSingleFileSize = 5 * 1024 * 1024
const maxTotalFileSize = 50 * 1024 * 1024
const maxFileNameLength = 100
const executableExtensions = new Set([
  'apk',
  'app',
  'bat',
  'bin',
  'cmd',
  'com',
  'cpl',
  'dll',
  'dmg',
  'exe',
  'gadget',
  'hta',
  'ins',
  'iso',
  'jar',
  'js',
  'jse',
  'lnk',
  'msi',
  'msp',
  'pif',
  'ps1',
  'scr',
  'sh',
  'vb',
  'vbe',
  'vbs',
  'ws',
  'wsf',
])

export type FileAttachmentValidationResult = {
  error?: string
  nextTotalSize: number
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${bytes} B`
}

export async function validateRichTextAttachment(file: File, currentTotalSize: number): Promise<FileAttachmentValidationResult> {
  const nextTotalSize = currentTotalSize + file.size
  const extension = getFileExtension(file.name)

  if (!file.name || file.name.length > maxFileNameLength) {
    return { error: buildMaxLengthMessage('File name', maxFileNameLength), nextTotalSize: currentTotalSize }
  }

  if (file.size <= 0) {
    return { error: 'Empty or damaged files are not accepted.', nextTotalSize: currentTotalSize }
  }

  if (file.size > maxSingleFileSize) {
    return { error: 'Each file must be 5 MB or smaller.', nextTotalSize: currentTotalSize }
  }

  if (nextTotalSize > maxTotalFileSize) {
    return { error: 'Total attached files must not exceed 50 MB.', nextTotalSize: currentTotalSize }
  }

  if (executableExtensions.has(extension)) {
    return { error: 'Executable files are not allowed.', nextTotalSize: currentTotalSize }
  }

  let buffer: ArrayBuffer
  try {
    buffer = await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer()
  } catch {
    return { error: 'Empty or damaged files are not accepted.', nextTotalSize: currentTotalSize }
  }

  if (isKnownCorruptFile(extension, new Uint8Array(buffer))) {
    return { error: 'Empty or damaged files are not accepted.', nextTotalSize: currentTotalSize }
  }

  if (isPasswordProtectedFile(extension, buffer)) {
    return { error: 'Password-protected files are not accepted.', nextTotalSize: currentTotalSize }
  }

  return { nextTotalSize }
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.trim().toLowerCase() || ''
}

function isKnownCorruptFile(extension: string, bytes: Uint8Array) {
  if (bytes.length === 0) return true
  if (extension === 'pdf') return !startsWithAscii(bytes, '%PDF-')
  if (['zip', 'docx', 'xlsx', 'pptx'].includes(extension)) return !(bytes[0] === 0x50 && bytes[1] === 0x4b)
  return false
}

function isPasswordProtectedFile(extension: string, buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)

  if (extension === 'pdf') {
    return new TextDecoder('latin1').decode(bytes).includes('/Encrypt')
  }

  if (['zip', 'docx', 'xlsx', 'pptx'].includes(extension)) {
    return hasEncryptedZipEntry(bytes)
  }

  return false
}

function startsWithAscii(bytes: Uint8Array, value: string) {
  return Array.from(value).every((char, index) => bytes[index] === char.charCodeAt(0))
}

function hasEncryptedZipEntry(bytes: Uint8Array) {
  for (let index = 0; index < bytes.length - 8; index += 1) {
    if (bytes[index] !== 0x50 || bytes[index + 1] !== 0x4b || bytes[index + 2] !== 0x03 || bytes[index + 3] !== 0x04) continue
    const generalPurposeFlag = bytes[index + 6] | (bytes[index + 7] << 8)
    if ((generalPurposeFlag & 0x01) === 0x01) return true
  }

  return false
}
