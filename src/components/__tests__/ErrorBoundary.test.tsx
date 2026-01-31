import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppErrorBoundary, RouteErrorBoundary } from '../ErrorBoundary'

// Mock Sentry
vi.mock('@sentry/react', () => ({
  ErrorBoundary: ({ children, fallback }: { children: React.ReactNode; fallback: (props: { error: Error; resetError: () => void }) => React.ReactNode }) => {
    return <SentryErrorBoundaryMock fallback={fallback}>{children}</SentryErrorBoundaryMock>
  },
}))

// A real React error boundary to simulate Sentry.ErrorBoundary behavior
import React from 'react'

class SentryErrorBoundaryMock extends React.Component<{
  children: React.ReactNode
  fallback: (props: { error: Error; resetError: () => void }) => React.ReactNode
}, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        resetError: () => this.setState({ error: null }),
      })
    }
    return this.props.children
  }
}

function ThrowError({ message }: { message: string }) {
  throw new Error(message)
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <AppErrorBoundary>
        <div>Hello</div>
      </AppErrorBoundary>
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders fallback UI on error', () => {
    render(
      <AppErrorBoundary>
        <ThrowError message="test crash" />
      </AppErrorBoundary>
    )
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })

  it('Go Home link points to /', () => {
    render(
      <AppErrorBoundary>
        <ThrowError message="test" />
      </AppErrorBoundary>
    )
    expect(screen.getByText('Go Home').closest('a')).toHaveAttribute('href', '/')
  })
})

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <RouteErrorBoundary>
        <div>Page Content</div>
      </RouteErrorBoundary>
    )
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('renders route-level fallback on error', () => {
    render(
      <RouteErrorBoundary>
        <ThrowError message="page crash" />
      </RouteErrorBoundary>
    )
    expect(screen.getByText('Failed to Load Page')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })
})
