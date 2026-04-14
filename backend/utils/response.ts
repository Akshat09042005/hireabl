export function sendSuccess(res: any, status: number, message: string, data?: any) {
  return res.status(status).json({
    success: true,
    message,
    data,
  })
}

export function sendError(res: any, message: string, status: number = 400, code: string | null = null) {
  return res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {}),
  })
}