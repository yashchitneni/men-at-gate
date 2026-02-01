import * as Sentry from '@sentry/react';
import { useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

function ErrorFallback({ error, resetError }: { error?: Error; resetError?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-heading font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          {error?.message || 'An unexpected error occurred. Our team has been notified.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Go Home
          </Button>
          {resetError && (
            <Button onClick={resetError} className="bg-accent hover:bg-accent/90">
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ({ error, resetError }) => (
      <ErrorFallback error={error as Error} resetError={resetError} />
    ),
    beforeCapture: (scope) => {
      scope.setTag('boundary', 'route');
    },
  }
);

export function RouteErrorBoundary() {
  const error = useRouteError();
  if (error) {
    Sentry.captureException(error);
  }
  return <ErrorFallback error={error instanceof Error ? error : new Error(String(error))} />;
}

export default ErrorFallback;
