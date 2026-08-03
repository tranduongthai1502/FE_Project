export function getDownloadFilename(contentDisposition: unknown, fallbackFilename: string) {
  const header = String(contentDisposition || '')
  const utf8FilenameMatch = header.match(/filename\*=UTF-8''([^;]+)/i)
  const filenameMatch = header.match(/filename="?([^";]+)"?/i)
  const filename = utf8FilenameMatch?.[1] || filenameMatch?.[1]

  return filename ? decodeURIComponent(filename) : fallbackFilename
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
