export async function getErrorMessage(res, fallback = 'Something went wrong') {
  try {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      return data?.message || fallback
    }
    return fallback
  } catch {
    return fallback
  }
}
