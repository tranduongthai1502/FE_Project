export function getResponsePayload(payload: any): any {
  const body = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  return body?.data && typeof body.data === 'object' ? body.data : body
}

export function getUserDetailPayload(payload: any): any {
  const body = getResponsePayload(payload)

  return (
    body?.user ||
    body?.staff ||
    body?.account ||
    body?.profile ||
    body?.result ||
    body?.content ||
    body?.record ||
    body?.item ||
    body
  )
}
