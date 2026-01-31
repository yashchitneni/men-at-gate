import * as Sentry from '@sentry/react'

export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error(error)
  Sentry.captureException(error, context ? { extra: context } : undefined)
}

export function captureMessage(msg: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(msg, level)
}

export function setUserContext(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user)
}
