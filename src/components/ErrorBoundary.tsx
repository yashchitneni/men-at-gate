import * as Sentry from '@sentry/react'
import { AlertTriangle } from 'lucide-react'

function ErrorFallback({ resetError }: { error: unknown; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/20 p-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
        </div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-white">
          Something Went Wrong
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          An unexpected error occurred. The error has been reported and we'll look into it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              resetError()
              window.location.reload()
            }}
            className="px-6 py-3 bg-[hsl(47,95%,50%)] text-[hsl(222,47%,11%)] font-heading font-bold uppercase tracking-wider text-sm rounded hover:bg-[hsl(47,95%,60%)] transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-gray-600 text-gray-300 font-heading font-bold uppercase tracking-wider text-sm rounded hover:border-gray-400 hover:text-white transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error} resetError={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  )
}

export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
            <h2 className="font-heading text-xl font-bold uppercase tracking-wider">
              Failed to Load Page
            </h2>
            <p className="text-muted-foreground text-sm">
              This page encountered an error. Other parts of the app should still work.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  resetError()
                  window.location.reload()
                }}
                className="px-4 py-2 bg-primary text-primary-foreground font-heading font-bold uppercase tracking-wider text-xs rounded hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-4 py-2 border border-border text-muted-foreground font-heading font-bold uppercase tracking-wider text-xs rounded hover:text-foreground transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
